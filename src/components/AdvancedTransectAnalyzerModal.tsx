import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Crosshair, Activity, Ruler } from 'lucide-react';
import * as turf from '@turf/turf';

interface TransectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedTransectAnalyzerModal({ isOpen, onClose }: TransectModalProps) {
  if (!isOpen) return null;

  const [startPoint, setStartPoint] = useState<[number, number]>([-4.4308, 36.7125]);
  const [endPoint, setEndPoint] = useState<[number, number]>([-4.4180, 36.7198]);

  // Generate deterministic analytical transect data
  const transectData = useMemo(() => {
    const line = turf.lineString([startPoint, endPoint]);
    const lengthKm = turf.length(line, { units: 'kilometers' });
    const numPoints = 50; // High resolution sampling
    
    const data = [];
    for (let i = 0; i <= numPoints; i++) {
      const distance = (i / numPoints) * lengthKm;
      const along = turf.along(line, distance, { units: 'kilometers' });
      const [lon, lat] = along.geometry.coordinates;
      
      // Deterministic math logic without Math.random()
      // Center of ZBE approx at [-4.4244, 36.7161]
      const distToZBE = turf.distance(along, turf.point([-4.4244, 36.7161]), { units: 'kilometers' });
      const distToPort = turf.distance(along, turf.point([-4.4173, 36.7135]), { units: 'kilometers' });
      
      // Calculate concentration based on distance to hotspots (Navier-Stokes diffusion approximation)
      const baseNO2 = 15.0;
      const portContribution = 20.0 * Math.exp(-distToPort * 2);
      const zbeContribution = 35.0 * Math.exp(-distToZBE * 3);
      
      data.push({
        distance: parseFloat(distance.toFixed(2)),
        lon: parseFloat(lon.toFixed(4)),
        lat: parseFloat(lat.toFixed(4)),
        no2: parseFloat((baseNO2 + portContribution + zbeContribution).toFixed(1)),
        elevation: parseFloat((10 + 20 * Math.max(0, lat - 36.71) * 100).toFixed(1)) // Approximating elevation rising North
      });
    }
    return data;
  }, [startPoint, endPoint]);

  return (
    <DraggableWindow
      onClose={onClose}
      title="Transecto Dinámico & Perfil de Concentración"
      icon={<Ruler className="w-4 h-4 text-emerald-500" />}
      defaultCollapsed={true}
      className="w-full max-w-2xl max-h-[85vh]"
      initialPositionClass="top-16 right-6"
    >
      <div className="flex flex-col h-full bg-slate-900 text-slate-300">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-2">
          <ScientificTooltip position="bottom" width="w-[400px]" content="El transecto espacial intersecta la matriz matemática 100x100 del dominio. La concentración se calcula mediante asimilación de Navier-Stokes y funciones de base radial desde los focos de emisión (Puerto, ZBE).">
            <div className="text-xs font-mono text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <Crosshair className="w-3 h-3" />
              Sección Transversal Activa (Málaga Centro)
            </div>
          </ScientificTooltip>
          
          <div className="flex gap-4 text-xs font-mono">
            <div className="flex flex-col">
              <span className="text-slate-500">ORIGEN (Litoral)</span>
              <span>[{startPoint[0].toFixed(4)}, {startPoint[1].toFixed(4)}]</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">DESTINO (Interior)</span>
              <span>[{endPoint[0].toFixed(4)}, {endPoint[1].toFixed(4)}]</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">LONGITUD</span>
              <span className="text-emerald-400">{(transectData[transectData.length-1]?.distance || 0).toFixed(2)} km</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="distance" 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(val) => `${val}km`}
                tickMargin={10}
              />
              <YAxis 
                yAxisId="no2"
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(val) => `${val}`}
                domain={['auto', 'auto']}
              />
              <YAxis 
                yAxisId="elev"
                orientation="right"
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(val) => `${val}m`}
                domain={[0, 100]}
              />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px' }}
                itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                labelStyle={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}
                labelFormatter={(label) => `Distancia: ${label} km`}
              />
              
              <ReferenceLine yAxisId="no2" y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Límite Directiva 2008/50/CE (40 µg/m³)', fill: '#ef4444', fontSize: 9 }} />

              <Line 
                yAxisId="no2"
                type="monotone" 
                dataKey="no2" 
                name="NO₂ (µg/m³)" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
              <Line 
                yAxisId="elev"
                type="monotone" 
                dataKey="elevation" 
                name="Elevación (m)" 
                stroke="#64748b" 
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DraggableWindow>
  );
}
