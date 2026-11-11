import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Scale, Database, Clock, BookOpen, Sliders } from 'lucide-react';
import { MeteoData, PHYSICS_INFORMED_DIGITAL_TWIN_DECLARATION } from '../lib/physics';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { RegulatoryComplianceDiagram } from './RegulatoryComplianceDiagram';

interface RegulatoryAuditModalProps {
  data: MeteoData;
  onClose: () => void;
}

export function RegulatoryAuditModal({ data, onClose }: RegulatoryAuditModalProps) {
  const [is2030Horizon, setIs2030Horizon] = useState(false);

  const audit = [
    {
      pollutant: 'Dióxido de Nitrógeno (NO₂)',
      value: data.no2_satelite_base,
      unit: 'µg/m³',
      euLimit: 40,
      euLimit2030: 20, 
      whoLimit: 25,
      maxAxis: 80,
      desc: 'Tóxico respiratorio. Principalmente emitido por tráfico diésel y combustión.',
      scientificBasis: 'Directiva 2008/50/CE (Límite anual 40 µg/m³; umbral de alerta 400 µg/m³). Precursor de aerosoles de nitrato y O3.'
    },
    {
      pollutant: 'Material Particulado Fino (PM2.5)',
      value: data.pm2_5,
      unit: 'µg/m³',
      euLimit: 20,
      euLimit2030: 10,
      whoLimit: 15,
      maxAxis: 50,
      desc: 'Alta penetración alveolar. Combustión y aerosoles secundarios.',
      scientificBasis: 'Directiva 2008/50/CE & Revisión 2024/1041. Partículas respirables <2.5 µm asociadas a riesgo cardiovascular.'
    },
    {
      pollutant: 'Material Particulado Torácico (PM10)',
      value: data.pm10,
      unit: 'µg/m³',
      euLimit: 40,
      euLimit2030: 20,
      whoLimit: 45,
      maxAxis: 80,
      desc: 'Fracción torácica. Incluye polvo sahariano, aerosol marino y abrasión de frenos.',
      scientificBasis: 'Directiva 2008/50/CE: Máximo 35 superaciones anuales del valor diario de 50 µg/m³; límite anual 40 µg/m³.'
    },
    {
      pollutant: 'Ozono Troposférico (O₃)',
      value: data.ozone,
      unit: 'µg/m³',
      euLimit: 120,
      euLimit2030: 100, // New tentative limit
      whoLimit: 100,
      maxAxis: 180,
      desc: 'Contaminante secundario. Fuerte oxidante fotolítico.',
      scientificBasis: 'Directiva 2008/50/CE: Valor objetivo protección salud 120 µg/m³ (máximo diario medias 8h; no superar 25 días/año).'
    }
  ];

  return (
    <DraggableWindow
      title="Auditoría Normativa & Directivas Europeas"
      icon={<Scale className="w-4 h-4 text-blue-400" />}
      badge={
        <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-600 px-1.5 py-0.5 font-mono font-bold">
          LEGAL & HEALTH AUDIT
        </span>
      }
      onClose={onClose}
      headerColorClass="text-blue-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-4xl"
      initialPositionClass="top-10 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-3">
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0f18] space-y-4">
          
          <div className="bg-slate-900/80 border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase text-slate-400 font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500"/> Contrastación en Tiempo Real
              </h3>
              <ScientificTooltip position="bottom" width="w-[300px]" content="Conmutador de rigor normativo. Al activar 2030, el modelo evalúa la conformidad frente a los límites draconianos de la Directiva UE 2024/1618.">
                <button 
                  onClick={() => setIs2030Horizon(!is2030Horizon)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded flex items-center gap-2 transition-all ${
                    is2030Horizon 
                      ? 'bg-purple-900/50 border border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                      : 'bg-slate-800 border border-slate-600 text-slate-300'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  HORIZONTE UE 2030 (DIR 2024/1618): {is2030Horizon ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </ScientificTooltip>
            </div>
            
            <div className="space-y-4">
              {audit.map(item => {
                const activeLimit = is2030Horizon ? item.euLimit2030 : item.euLimit;
                const euExceeded = item.value > activeLimit;
                const whoExceeded = item.value > item.whoLimit;
                
                return (
                  <div key={item.pollutant} className="border border-slate-800 bg-black/40 p-3 grid grid-cols-1 md:grid-cols-4 gap-4 items-center relative overflow-hidden group">
                    <ScientificTooltip position="top" width="w-[300px]" content={item.scientificBasis}>
                      <div className="col-span-1 md:col-span-2 cursor-help">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{item.pollutant}</div>
                        <div className="flex items-end gap-2">
                          <div className="text-2xl font-light text-slate-200 font-mono">
                            {item.value.toFixed(1)} <span className="text-[10px] text-slate-500">{item.unit}</span>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">{item.desc}</div>
                        
                        <RegulatoryComplianceDiagram 
                          value={item.value} 
                          limit2008={item.euLimit} 
                          limit2030={item.euLimit2030} 
                          whoLimit={item.whoLimit} 
                          maxAxis={item.maxAxis}
                        />
                      </div>
                    </ScientificTooltip>
                    
                    <ScientificTooltip position="top" width="w-[280px]" content={is2030Horizon ? "Nuevo umbral estricto para el Horizonte 2030, Directiva UE 2024/1618." : "Límite legal anual vinculante de la Directiva Europea 2008/50/CE para la protección de la salud humana en zonas urbanas."}>
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] uppercase text-slate-500">{is2030Horizon ? 'Directiva UE (2024/1618)' : 'Directiva UE (2008/50/CE)'}</div>
                        <div className={`flex items-center gap-2 p-1.5 border ${euExceeded ? 'bg-red-950/30 border-red-900/50 text-red-400' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'}`}>
                          {euExceeded ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          <span className="font-mono text-xs">{activeLimit} {item.unit}</span>
                        </div>
                      </div>
                    </ScientificTooltip>
                    
                    <ScientificTooltip position="top" width="w-[280px]" content="Guía científica recomendada de la OMS (Global Air Quality Guidelines 2021) basada en evidencia epidemiológica de efectos adversos a la salud.">
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] uppercase text-slate-500">Directriz OMS (2021)</div>
                        <div className={`flex items-center gap-2 p-1.5 border ${whoExceeded ? 'bg-orange-950/30 border-orange-900/50 text-orange-400' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'}`}>
                          {whoExceeded ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          <span className="font-mono text-xs">{item.whoLimit} {item.unit}</span>
                        </div>
                      </div>
                    </ScientificTooltip>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-emerald-950/20 border-l-2 border-emerald-500 p-3 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-emerald-300 leading-relaxed font-mono">
              <strong>PRINCIPIO ARQUITECTÓNICO DEL GEMELO DIGITAL:</strong> {PHYSICS_INFORMED_DIGITAL_TWIN_DECLARATION}
            </p>
          </div>
          <div className="bg-blue-950/20 border-l-2 border-blue-500 p-3 flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-300 leading-relaxed font-mono">
              <strong>TRAZABILIDAD LEGAL:</strong> Los umbrales mostrados representan los niveles de referencia más estrictos para la protección de la salud humana. La exposición crónica a valores que excedan la directriz de la OMS está correlacionada de forma mecanicista con un incremento de la morbimortalidad cardiopulmonar, avalado por metaanálisis toxicológicos (Cero simulaciones. Ref: WHO Global Air Quality Guidelines 2021).
            </p>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
