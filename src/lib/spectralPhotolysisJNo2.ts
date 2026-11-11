/**
 * Atenuación Radiativa Espectral UV-A / UV-B y Fotólisis Dinámica J_NO2(theta_z, tau_aer)
 * Referencia: Journal of Quantitative Spectroscopy & Radiative Transfer (JQSRT) (2025/2026)
 * Ecuación integral:
 *   J_NO2 = int_{290nm}^{420nm} sigma_NO2(lambda, T) * phi_NO2(lambda, T) * F(lambda, theta_z, tau_aer) d_lambda
 */

export interface SpectralPhotolysisParams {
  solarZenithAngleDeg: number; // theta_z (0° zenit directo, 90° horizonte)
  aerosolOpticalDepth550: number; // tau_aer (AOD 550nm: ej. 0.15 limpio, 0.85 calima sahariana)
  temperatureC: number;
  urbanSurfaceAlbedo: number; // ej. 0.14 asfalto / 0.22 hormigón claro
  totalOzoneColDobson: number; // ej. 310 DU
}

export interface SpectralPhotolysisResults {
  jNo2RateS1: number;
  uvAEffectiveFluxWm2: number;
  uvBEffectiveFluxWm2: number;
  transmittanceFactorPct: number;
  calimaSaharianaAttenuationPct: number;
  photolysisLifetimeSec: number;
}

export function computeSpectralPhotolysisJNo2(
  params: SpectralPhotolysisParams
): SpectralPhotolysisResults {
  const { solarZenithAngleDeg, aerosolOpticalDepth550, temperatureC, urbanSurfaceAlbedo, totalOzoneColDobson } = params;

  // Zenith angle in radians with airmass correction (Kasten & Young 1989)
  const thetaRad = (Math.min(88, Math.max(0, solarZenithAngleDeg)) * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);
  const airMass = 1.0 / (cosTheta + 0.50572 * Math.pow(96.07995 - solarZenithAngleDeg, -1.6364));

  // Rayleigh + Aerosol Optical Depth attenuation in UV-A band (380 nm)
  const tauRayleigh380 = 0.44;
  const tauAerosol380 = aerosolOpticalDepth550 * Math.pow(550 / 380, 1.2); // Angstrom law
  const totalOpticalDepth = (tauRayleigh380 + tauAerosol380);

  // Direct and diffuse UV flux reaching street level
  const directTransmittance = Math.exp(-totalOpticalDepth * airMass);
  const diffuseFactor = 0.45 * (1 - directTransmittance) * (1 + 2.0 * urbanSurfaceAlbedo);
  const totalUVATransmittance = Math.min(1.0, directTransmittance + diffuseFactor);

  // Clear-sky unattenuated top-of-atmosphere J0_NO2 ~ 0.0108 s^-1
  const baseJ0 = 0.0108;
  const tempCorrection = 1.0 + (temperatureC - 25.0) * 0.0018;
  const jNo2RateS1 = parseFloat((baseJ0 * cosTheta * totalUVATransmittance * tempCorrection).toFixed(5));

  // Actinometric UV-A & UV-B fluxes
  const uvAEffectiveFluxWm2 = parseFloat((42.0 * cosTheta * totalUVATransmittance).toFixed(2));
  const uvBOzoneFactor = Math.exp(-(totalOzoneColDobson / 300) * 0.8 * airMass);
  const uvBEffectiveFluxWm2 = parseFloat((2.1 * cosTheta * uvBOzoneFactor * (1 - tauAerosol380 * 0.3)).toFixed(3));

  // Percentage attenuation specifically due to Saharan dust / aerosol load
  const cleanAOD = 0.08;
  const cleanTransmittance = Math.exp(-(tauRayleigh380 + cleanAOD * 1.5) * airMass);
  const calimaSaharianaAttenuationPct = parseFloat((Math.max(0, (1 - totalUVATransmittance / Math.max(0.01, cleanTransmittance))) * 100).toFixed(1));

  const photolysisLifetimeSec = jNo2RateS1 > 1e-5 ? parseFloat((1.0 / jNo2RateS1).toFixed(1)) : 9999.0;
  const transmittanceFactorPct = parseFloat((totalUVATransmittance * 100).toFixed(1));

  return {
    jNo2RateS1,
    uvAEffectiveFluxWm2,
    uvBEffectiveFluxWm2,
    transmittanceFactorPct,
    calimaSaharianaAttenuationPct,
    photolysisLifetimeSec
  };
}
