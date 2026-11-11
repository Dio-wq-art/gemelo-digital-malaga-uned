/**
 * SOLVER DE DINÁMICA DE FLUIDOS COMPUTACIONAL A MICROESCALA (LBM D2Q9)
 * ===================================================================
 * Tesis Doctoral - Modelización de Flujo Turbulento en Cañones Urbanos (Málaga).
 *
 * Fundamentos Físicos del Lattice Boltzmann Method (LBM D2Q9):
 * 1. Discretización de Velocidades D2Q9:
 *    c_0 = (0,0) [w=4/9]
 *    c_1..4 = (±1,0), (0,±1) [w=1/9]
 *    c_5..8 = (±1,±1), (±1,∓1) [w=1/36]
 * 2. Distribución de Equilibrio de Maxwell-Boltzmann (a bajo Mach, c_s^2 = 1/3):
 *    f_i^eq(ρ, u) = w_i * ρ * [1 + (c_i·u)/c_s^2 + (c_i·u)^2/(2 c_s^4) - (u·u)/(2 c_s^2)]
 * 3. Operador de Colisión BGK (Bhatnagar-Gross-Krook):
 *    f_i*(x, t) = f_i(x, t) - (1/τ) * [f_i(x, t) - f_i^eq(x, t)]
 *    Viscosidad cinemática reticular: ν = c_s^2 * (τ - 0.5)
 * 4. Streaming y Condiciones de Contorno:
 *    - Rebote No-Deslizante (Bounce-Back): En fachadas y suelo de los edificios (u = 0).
 *    - Zou-He en Cubierta (y = Ny - 1): Flujo rasante inducido por viento suprayacente (u_roof).
 *    - Periodicidad lateral o amortiguación.
 * 5. Transporte Pasivo de Trazador (Emisiones de Tráfico en Calzada):
 *    Convección-difusión finita acoplada al campo u(x,y).
 *
 * Rigor Doctrinal: 100% Determinista. Cero funciones estocásticas (Math.random prohibido).
 */

export interface LbmConfig {
  nx: number; // Discretización horizontal (malla reticular, ej: 80)
  ny: number; // Discretización vertical (malla reticular, ej: 50)
  canyonLeftX: number; // Inicio de la calle (ej: 25)
  canyonRightX: number; // Fin de la calle (ej: 55) => Ancho W = 30
  buildingHeightY: number; // Altura del cañón (ej: 30) => Altura H = 30
  tau: number; // Tiempo de relajación BGK (típicamente 0.55 - 0.90)
  uRoof: number; // Velocidad de viento en cubierta (adimensional en retículo, ej: 0.08)
  trafficEmissionRate: number; // Tasa de emisión continua en calzada
}

export interface LbmState {
  step: number;
  timeSec: number;
  reynoldsNumber: number;
  maxVelocity: number;
  vorticityMatrix: Float32Array; // nx * ny
  velocityMagnitudeMatrix: Float32Array; // nx * ny
  uXMatrix: Float32Array; // nx * ny
  uYMatrix: Float32Array; // nx * ny
  pollutantMatrix: Float32Array; // nx * ny
  obstacleMask: Uint8Array; // nx * ny (1 = edificio/sólido, 0 = aire)
}

// Direcciones discretas D2Q9
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
// Pesos del retículo w_i
const W = [
  4 / 9,
  1 / 9, 1 / 9, 1 / 9, 1 / 9,
  1 / 36, 1 / 36, 1 / 36, 1 / 36
];
// Direcciones opuestas para Bounce-Back
const OPPOSITE = [0, 3, 4, 1, 2, 7, 8, 5, 6];

export class LbmUrbanCanyonSolver {
  private config: LbmConfig;
  private f: Float32Array; // nx * ny * 9
  private fTemp: Float32Array; // nx * ny * 9
  private rho: Float32Array; // nx * ny
  private uX: Float32Array; // nx * ny
  private uY: Float32Array; // nx * ny
  private pollutant: Float32Array; // nx * ny
  private pollutantTemp: Float32Array; // nx * ny
  private obstacle: Uint8Array; // nx * ny
  private stepCount: number = 0;

  constructor(config?: Partial<LbmConfig>) {
    this.config = {
      nx: 84,
      ny: 56,
      canyonLeftX: 26,
      canyonRightX: 58,
      buildingHeightY: 34,
      tau: 0.62,
      uRoof: 0.085,
      trafficEmissionRate: 1.0,
      ...config
    };

    const size = this.config.nx * this.config.ny;
    this.f = new Float32Array(size * 9);
    this.fTemp = new Float32Array(size * 9);
    this.rho = new Float32Array(size);
    this.uX = new Float32Array(size);
    this.uY = new Float32Array(size);
    this.pollutant = new Float32Array(size);
    this.pollutantTemp = new Float32Array(size);
    this.obstacle = new Uint8Array(size);

    this.initGeometry();
    this.resetField();
  }

  private initGeometry(): void {
    const { nx, ny, canyonLeftX, canyonRightX, buildingHeightY } = this.config;
    this.obstacle.fill(0);

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        // Edificio Izquierdo (Sotavento)
        if (x < canyonLeftX && y < buildingHeightY) {
          this.obstacle[idx] = 1;
        }
        // Edificio Derecho (Barlovento)
        else if (x > canyonRightX && y < buildingHeightY) {
          this.obstacle[idx] = 1;
        }
        // Suelo del cañón
        else if (y === 0) {
          this.obstacle[idx] = 1;
        }
      }
    }
  }

  public resetField(): void {
    const { nx, ny, uRoof } = this.config;
    const size = nx * ny;
    this.stepCount = 0;

    for (let y = 0; y < ny; y++) {
      // Perfil inicial determinista: flujo rasante sobre tejados amortiguado en el cañón
      const yNorm = y / ny;
      const initialUx = y >= this.config.buildingHeightY 
        ? uRoof * Math.pow((y - this.config.buildingHeightY) / (ny - this.config.buildingHeightY + 1), 0.28)
        : 0;

      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        this.rho[idx] = 1.0;
        this.uX[idx] = this.obstacle[idx] === 1 ? 0 : initialUx;
        this.uY[idx] = 0;
        this.pollutant[idx] = 0;
        this.pollutantTemp[idx] = 0;

        // Inicializar distribuciones de equilibrio f_i
        const u = this.uX[idx];
        const v = this.uY[idx];
        const uSq = u * u + v * v;

        for (let i = 0; i < 9; i++) {
          const cDotU = CX[i] * u + CY[i] * v;
          const feq = W[i] * 1.0 * (
            1.0 + 3.0 * cDotU + 4.5 * cDotU * cDotU - 1.5 * uSq
          );
          this.f[idx * 9 + i] = feq;
          this.fTemp[idx * 9 + i] = feq;
        }
      }
    }
  }

  /**
   * Ejecuta 1 paso temporal completo (Colisión BGK + Streaming + Condiciones de Contorno).
   */
  public step(): void {
    const { nx, ny, tau, uRoof, buildingHeightY, canyonLeftX, canyonRightX, trafficEmissionRate } = this.config;
    const omega = 1.0 / tau;

    // 1. Colisión BGK en fluidos
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        if (this.obstacle[idx] === 1) continue;

        const currentRho = this.rho[idx];
        const u = this.uX[idx];
        const v = this.uY[idx];
        const uSq = u * u + v * v;

        for (let i = 0; i < 9; i++) {
          const cDotU = CX[i] * u + CY[i] * v;
          const feq = W[i] * currentRho * (
            1.0 + 3.0 * cDotU + 4.5 * cDotU * cDotU - 1.5 * uSq
          );
          const fIndex = idx * 9 + i;
          this.fTemp[fIndex] = this.f[fIndex] - omega * (this.f[fIndex] - feq);
        }
      }
    }

    // 2. Streaming y Rebote (Bounce-Back)
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        if (this.obstacle[idx] === 1) continue;

        for (let i = 0; i < 9; i++) {
          // Coordenada vecina
          let nextX = x + CX[i];
          let nextY = y + CY[i];

          // Periodicidad horizontal en los límites del dominio
          if (nextX < 0) nextX = nx - 1;
          else if (nextX >= nx) nextX = 0;

          // En la cubierta superior: condición Zou-He de velocidad impuesta uRoof
          if (nextY >= ny) {
            this.f[idx * 9 + i] = W[i] * 1.0 * (1.0 + 3.0 * CX[i] * uRoof);
            continue;
          }
          if (nextY < 0) {
            nextY = 0;
          }

          const nextIdx = nextY * nx + nextX;

          // Si el nodo vecino es obstáculo sólido: Rebote no-deslizante
          if (this.obstacle[nextIdx] === 1) {
            const opp = OPPOSITE[i];
            this.f[idx * 9 + opp] = this.fTemp[idx * 9 + i];
          } else {
            this.f[nextIdx * 9 + i] = this.fTemp[idx * 9 + i];
          }
        }
      }
    }

    // 3. Cálculo de Momentos Macroscópicos (Densidad y Velocidad)
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        if (this.obstacle[idx] === 1) {
          this.uX[idx] = 0;
          this.uY[idx] = 0;
          this.rho[idx] = 1.0;
          continue;
        }

        let currentRho = 0;
        let sumUx = 0;
        let sumUy = 0;

        for (let i = 0; i < 9; i++) {
          const val = this.f[idx * 9 + i];
          currentRho += val;
          sumUx += val * CX[i];
          sumUy += val * CY[i];
        }

        this.rho[idx] = currentRho;
        this.uX[idx] = currentRho > 0 ? sumUx / currentRho : 0;
        this.uY[idx] = currentRho > 0 ? sumUy / currentRho : 0;
      }
    }

    // 4. Transporte de Contaminante (Advección-Difusión determinista)
    // Emisión continua en el piso de la calle entre los dos edificios
    const emissionY = 1;
    for (let x = canyonLeftX + 2; x <= canyonRightX - 2; x++) {
      const idx = emissionY * nx + x;
      this.pollutant[idx] = Math.min(100.0, this.pollutant[idx] + trafficEmissionRate * 0.4);
    }

    const diffCoeff = 0.08; // Difusividad molecular y turbulenta
    for (let y = 1; y < ny - 1; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        if (this.obstacle[idx] === 1) {
          this.pollutantTemp[idx] = 0;
          continue;
        }

        const leftX = (x - 1 + nx) % nx;
        const rightX = (x + 1) % nx;
        const u = this.uX[idx];
        const v = this.uY[idx];

        // Upwind scheme para advección estable de primer orden
        const cCenter = this.pollutant[idx];
        const cLeft = this.pollutant[y * nx + leftX];
        const cRight = this.pollutant[y * nx + rightX];
        const cDown = this.pollutant[(y - 1) * nx + x];
        const cUp = this.pollutant[(y + 1) * nx + x];

        const advX = u >= 0 ? u * (cCenter - cLeft) : u * (cRight - cCenter);
        const advY = v >= 0 ? v * (cCenter - cDown) : v * (cUp - cCenter);

        const laplacian = (cLeft + cRight + cDown + cUp - 4 * cCenter);
        const nextC = cCenter - (advX + advY) + diffCoeff * laplacian;

        this.pollutantTemp[idx] = Math.max(0, Math.min(100, nextC * 0.998)); // Atenuación de frontera
      }
    }

    // Copiar contaminante
    this.pollutant.set(this.pollutantTemp);
    this.stepCount++;
  }

  /**
   * Ejecuta N pasos y retorna el estado físico completo para visualización y análisis.
   */
  public stepN(steps: number = 8): LbmState {
    for (let s = 0; s < steps; s++) {
      this.step();
    }

    const { nx, ny, uRoof, canyonRightX, canyonLeftX, tau } = this.config;
    const size = nx * ny;
    const vorticity = new Float32Array(size);
    const speed = new Float32Array(size);
    let maxVel = 0;

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        if (this.obstacle[idx] === 1) {
          vorticity[idx] = 0;
          speed[idx] = 0;
          continue;
        }

        const u = this.uX[idx];
        const v = this.uY[idx];
        const mag = Math.sqrt(u * u + v * v);
        speed[idx] = mag;
        if (mag > maxVel) maxVel = mag;

        // Vorticidad central ω = ∂v/∂x - ∂u/∂y
        if (x > 0 && x < nx - 1 && y > 0 && y < ny - 1) {
          const dv_dx = (this.uY[y * nx + (x + 1)] - this.uY[y * nx + (x - 1)]) * 0.5;
          const du_dy = (this.uX[(y + 1) * nx + x] - this.uX[(y - 1) * nx + x]) * 0.5;
          vorticity[idx] = dv_dx - du_dy;
        }
      }
    }

    // Número de Reynolds de la cavidad: Re = U_roof * W / ν
    // donde ν_reticular = (1/3) * (τ - 0.5)
    const nu = (1 / 3) * Math.max(0.01, tau - 0.5);
    const canyonWidth = canyonRightX - canyonLeftX;
    const reynoldsNumber = Number(((uRoof * canyonWidth) / nu).toFixed(1));

    return {
      step: this.stepCount,
      timeSec: Number((this.stepCount * 0.05).toFixed(2)),
      reynoldsNumber,
      maxVelocity: Number(maxVel.toFixed(3)),
      vorticityMatrix: vorticity,
      velocityMagnitudeMatrix: speed,
      uXMatrix: this.uX,
      uYMatrix: this.uY,
      pollutantMatrix: this.pollutant,
      obstacleMask: this.obstacle
    };
  }

  public updateConfig(newConfig: Partial<LbmConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initGeometry();
    this.resetField();
  }

  public getConfig(): LbmConfig {
    return { ...this.config };
  }
}
