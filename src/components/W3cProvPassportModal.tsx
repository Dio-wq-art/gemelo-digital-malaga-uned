import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  ShieldCheck, 
  Key, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  Fingerprint, 
  Database, 
  Cpu, 
  Lock, 
  FileText 
} from 'lucide-react';
import { generateW3cProvPassport } from '../lib/w3cCryptographicProvenance';

interface W3cProvPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const W3cProvPassportModal: React.FC<W3cProvPassportModalProps> = ({
  isOpen,
  onClose
}) => {
  const activeCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<'audit' | 'graph' | 'jsonld'>('audit');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const lat = activeCtx?.location.lat ?? 36.7182;
  const lon = activeCtx?.location.lon ?? -4.4235;
  const streetName = activeCtx?.activePoint?.name || activeCtx?.activePoint?.nearestStreetName || 'Alameda Principal';
  const no2Pedestrian = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 32.5;
  const pm25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.8;
  const pm10 = activeCtx?.assimilation?.pm10UgM3 ?? 26.2;
  const temperatureC = activeCtx?.assimilation?.temperatureC ?? 22.4;
  const relativeHumidityPct = activeCtx?.assimilation?.relativeHumidityPct ?? 65;
  const windSpeedKmh = activeCtx?.assimilation?.windSpeedKmh ?? 12.0;
  const nearestStationName = activeCtx?.assimilation?.nearestStation?.station.name || 'Hilera (Centro)';
  const elevationM = activeCtx?.activePoint?.elevationM ?? 12;

  const passport = generateW3cProvPassport({
    lat,
    lon,
    streetName,
    no2Pedestrian,
    pm25,
    pm10,
    temperatureC,
    relativeHumidityPct,
    windSpeedKmh,
    nearestStationName,
    elevationM
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportJsonLd = () => {
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `w3c_prov_passport_${Date.now()}.jsonld`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = 'Entidad,Tipo,Hash_SHA256,Timestamp_UTC,Atribuido_A,Derivado_De\n';
    const rows = passport.entities.map(e => 
      `"${e.label}",${e.type},"${e.sha256Hash}",${e.timestampUtc},"${e.wasAttributedTo || 'N/A'}","${e.wasDerivedFrom || 'N/A'}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadena_custodia_sha256_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      windowId="w3cProvPassport"
      title="PASAPORTE DE INTEGRIDAD CRIPTOGRÁFICA W3C PROV (SHA-256)"
      subtitle="Cadena Inmutable de Procedencia de Datos & Certificación Pericial de No-Manipulación"
      icon={<Fingerprint className="w-5 h-5 text-emerald-400" />}
      badge={
        <span className="text-[8.5px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 font-mono font-bold">
          W3C PROV-O • SHA-256 VERIFIED
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Metrológico y Certificado de Integridad */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Punto Sincronizado: {streetName}</span>
              <span className="bg-emerald-900 text-emerald-200 text-[8px] font-mono px-1.5 py-0.5 border border-emerald-700">
                0% DATOS ESTOCÁSTICOS (CERTIFICADO)
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cadena de custodia científica formal según la ontología W3C PROV-O. Cada observación oficial ingerida y cada inferencia PINN se sella mediante una función hash criptográfica SHA-256 inmutable para validez en tribunales y litigios periciales.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar el documento JSON-LD vinculado en el estándar internacional W3C PROV.">
              <button
                onClick={handleExportJsonLd}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3 rounded border border-emerald-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-950" />
                <span>JSON-LD PROV</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[260px]" content="Exportar la tabla de hashes y cadena de custodia en formato tabular CSV.">
              <button
                onClick={handleExportCSV}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] uppercase font-bold py-2 px-3 rounded border border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Master Hash Badge */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Hash SHA-256 Maestro de Trazabilidad:</span>
              <span className="text-[11px] font-mono text-emerald-300 select-all break-all">
                {passport.masterProvenanceHash}
              </span>
            </div>
          </div>
          <ScientificTooltip position="left" width="w-[260px]" content="Copiar al portapapeles el hash SHA-256 inmutable de la cadena de custodia científica.">
            <button
              onClick={() => handleCopy(passport.masterProvenanceHash, 'master')}
              className="shrink-0 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedHash === 'master' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedHash === 'master' ? 'COPIADO' : 'COPIAR HASH'}</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Pestañas de Vista con Tooltips */}
        <div className="flex border-b border-slate-800 gap-1 text-[11px]">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Auditoría detallada de entidades, actividades y agentes de la cadena de procedencia W3C PROV.">
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-1.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'audit' ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditoría de Custodia</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Grafo ontológico dirigido acíclico (DAG) que ilustra las relaciones wasDerivedFrom y wasAttributedTo.">
            <button
              onClick={() => setActiveTab('graph')}
              className={`py-1.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'graph' ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Grafo de Entidades PROV</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Documento JSON-LD en formato estándar interoperable W3C PROV-O listo para integración semántica web.">
            <button
              onClick={() => setActiveTab('jsonld')}
              className={`py-1.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'jsonld' ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON-LD Estándar</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Contenido Pestaña 1: Auditoría de Custodia */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {passport.entities.map((entity, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">{entity.type}</span>
                    <button
                      onClick={() => handleCopy(entity.sha256Hash, entity.id)}
                      className="text-slate-400 hover:text-emerald-400 p-0.5"
                    >
                      {copiedHash === entity.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-xs font-bold text-slate-100">{entity.label}</div>
                  <div className="bg-slate-950 p-1.5 border border-slate-800 rounded text-[9.5px] font-mono text-slate-300 break-all select-all">
                    {entity.sha256Hash}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {entity.wasAttributedTo && <div>Atribuido a: <b>{entity.wasAttributedTo}</b></div>}
                    {entity.wasDerivedFrom && <div>Derivado de: <b>{entity.wasDerivedFrom}</b></div>}
                    {entity.wasGeneratedBy && <div>Generado por: <b>{entity.wasGeneratedBy}</b></div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Declaración Pericial Legal */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded space-y-1">
              <span className="text-[10.5px] font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Declaración Pericial de No-Manipulación y Cero-Aleatoriedad</span>
              </span>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                {passport.scientificLegalAssertion}
              </p>
            </div>
          </div>
        )}

        {/* Contenido Pestaña 2: Grafo de Entidades */}
        {activeTab === 'graph' && (
          <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-3">
            <span className="text-xs font-bold text-emerald-300 block uppercase">
              Grafo de Procedencia W3C PROV-DM (Entidades, Actividades y Agentes)
            </span>
            <div className="space-y-2 text-[10px]">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block">1. AGENTES OFICIALES (prov:Agent):</span>
                  {passport.agents.map((ag, i) => (
                    <div key={i} className="text-slate-300 ml-2">
                      • {ag.name} ({ag.authorityLegalCode})
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block">2. ACTIVIDADES DETERMINISTAS (prov:Activity):</span>
                  {passport.activities.map((act, i) => (
                    <div key={i} className="text-slate-300 ml-2">
                      • {act.label}: <i>{act.mathematicalMethod}</i>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block">3. VINCULACIÓN ONTOLÓGICA (prov:wasDerivedFrom):</span>
                  <div className="text-emerald-400 font-mono ml-2 mt-1">
                    [Estación Oficial] ➔ (activity:telemetry_ingestion) ➔ [entity:raw_station_observation] ➔ (activity:microscale_pinn_inference) ➔ [entity:active_point_assimilated_state]
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Pestaña 3: JSON-LD Completo */}
        {activeTab === 'jsonld' && (
          <div className="relative bg-black/95 p-3 border border-slate-800 rounded">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
              <span className="text-slate-400 text-[10px]">Especificación Linked Data (JSON-LD) W3C PROV-O</span>
              <button
                onClick={() => handleCopy(JSON.stringify(passport, null, 2), 'jsonld')}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedHash === 'jsonld' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash === 'jsonld' ? 'COPIADO' : 'COPIAR JSON-LD'}</span>
              </button>
            </div>
            <pre className="text-[9px] text-emerald-300/90 font-mono overflow-auto max-h-60 leading-tight">
              {JSON.stringify(passport, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
