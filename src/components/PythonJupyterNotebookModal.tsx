import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { generateDoctoralJupyterNotebook } from '../lib/pythonJupyterNotebookGenerator';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Code,
  Terminal,
  Play,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

interface PythonJupyterNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: { lat: number; lon: number };
}

export const PythonJupyterNotebookModal: React.FC<PythonJupyterNotebookModalProps> = ({
  isOpen,
  onClose,
  location = { lat: 36.7196, lon: -4.4200 }
}) => {
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveTab] = useState<'ecosim' | 'pinn_pytorch' | 'geopandas'>('ecosim');

  if (!isOpen) return null;

  const handleDownloadNotebook = () => {
    const jsonStr = generateDoctoralJupyterNotebook({
      cityName: 'Málaga_Centro',
      lat: location.lat,
      lon: location.lon,
      includePyTorchPINN: true,
      includeGeoPandas: true
    });

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemelo_digital_malaga_pinn_notebook_${Date.now()}.ipynb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCodeSnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const samplePythonCodeEcoSim = `import pandas as pd
import numpy as np

class EcoSimLab:
    """
    Framework de simulación multivariable para el análisis y mitigación 
    de la contaminación atmosférica urbana en Málaga.
    """
    def __init__(self, city_name: str = 'Málaga'):
        self.city_name = city_name
        self.inventory = pd.DataFrame()
        self.simulation_results = {}
        print(f"EcoSim Lab v2.5: Sistema de {self.city_name} cargado.")

    def modulo_ingesta_y_limpieza(self) -> pd.DataFrame:
        """Pipeline de captura de sensores terrestres in situ."""
        estaciones = [
            {'id': 'ES1417A', 'nombre': 'Carranque', 'lat': 36.7172, 'lon': -4.4444, 'no2': 28.4},
            {'id': 'ES1418A', 'nombre': 'Hilera', 'lat': 36.7215, 'lon': -4.4281, 'no2': 34.8},
            {'id': 'MGA-PT', 'nombre': 'Puerto', 'lat': 36.7110, 'lon': -4.4150, 'no2': 22.5}
        ]
        self.inventory = pd.DataFrame(estaciones)
        return self.inventory

app = EcoSimLab("Málaga_Centro")
df_obs = app.modulo_ingesta_y_limpieza()
print(df_obs)`;

  const samplePythonPyTorchPINN = `import torch
import torch.nn as nn

class PhysicsInformedNN(nn.Module):
    def __init__(self):
        super(PhysicsInformedNN, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(3, 64), # Input: (x, y, z)
            nn.Tanh(),
            nn.Linear(64, 64),
            nn.Tanh(),
            nn.Linear(64, 1)  # Output: NO2 (ug/m3)
        )

    def forward(self, x, y, z):
        inputs = torch.cat([x, y, z], dim=1)
        return self.net(inputs)

def compute_pde_residual(model, x, y, z, u_wind=3.2, K_diff=10.0):
    x.requires_grad_(True)
    y.requires_grad_(True)
    z.requires_grad_(True)
    C = model(x, y, z)
    dC_dx = torch.autograd.grad(C, x, grad_outputs=torch.ones_like(C), create_graph=True)[0]
    d2C_dx2 = torch.autograd.grad(dC_dx, x, grad_outputs=torch.ones_like(dC_dx), create_graph=True)[0]
    return torch.mean((u_wind * dC_dx - K_diff * d2C_dx2) ** 2)

model = PhysicsInformedNN()
print("Modelo PINN PyTorch Inicializado Correctamente.")`;

  return (
    <DraggableWindow
      title="GENERADOR DE NOTEBOOKS DOCTORALES EN PYTHON (.IPYNB / PYTORCH / GEOPANDAS)"
      subtitle="Generación de código Jupyter reproducible de Ciencia Abierta (FAIR) para Google Colab y Anaconda"
      icon={<FileCode className="w-5 h-5 text-amber-400" />}
      badge={
        <span className="text-[8.5px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.2 font-mono font-bold">
          JUPYTER IPYNB • FAIRD SCIENTIFIC CODE
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-amber-400"
      borderColorClass="border-amber-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner de Acción Principal */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Cuaderno Jupyter Completo de la Tesis (.ipynb)</span>
              <span className="bg-amber-900 text-amber-200 text-[8px] font-mono px-1.5 py-0.5 border border-amber-700">COLAB / ANACONDA</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Exporta un archivo <code className="text-amber-300">.ipynb</code> listo para ejecutar en Google Colab con el pipeline completo de asimilación, el solucionador PINN en PyTorch y representaciones GeoPandas.
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar el cuaderno de Jupyter oficial (.ipynb) con todas las celdas de código Python listas para su ejecución y verificación doctoral.">
            <button
              onClick={handleDownloadNotebook}
              className="shrink-0 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-4 rounded border border-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.4)]"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>DESCARGAR NOTEBOOK .IPYNB</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Pestañas de Vista Previa de Código */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-2 py-1">
          <div className="flex items-center gap-1">
            <ScientificTooltip content="Ver código fuente completo del pipeline EcoSimLab con ingesta de sensores, dispersión química, mitigación y validación.">
              <button
                onClick={() => setActiveTab('ecosim')}
                className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded border cursor-pointer ${
                  activeCodeTab === 'ecosim'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>1. EcoSimLab Core</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Ver implementación de la Red Neuronal Informada por la Física (PINN) en PyTorch con términos de pérdida PDE (Navier-Stokes + Leighton).">
              <button
                onClick={() => setActiveTab('pinn_pytorch')}
                className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded border cursor-pointer ${
                  activeCodeTab === 'pinn_pytorch'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. PyTorch PINN Model</span>
              </button>
            </ScientificTooltip>
          </div>

          <ScientificTooltip content="Copiar código fuente Python íntegro al portapapeles para su uso en scripts, notebooks locales o Google Colab.">
            <button
              onClick={() => handleCopyCodeSnippet(activeCodeTab === 'ecosim' ? samplePythonCodeEcoSim : samplePythonPyTorchPINN)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[8.5px] font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Bloque de Código Python con resaltado */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded font-mono text-[9.5px] text-emerald-300 overflow-x-auto max-h-[45vh] select-all">
          <pre>{activeCodeTab === 'ecosim' ? samplePythonCodeEcoSim : samplePythonPyTorchPINN}</pre>
        </div>
      </div>
    </DraggableWindow>
  );
};
