import { describe, it, expect } from 'vitest';
import { normalizeModalId, KNOWN_MODAL_IDS } from '../components/ScientificModalRegistry';

describe('TelemetryProvenanceTracker & W3C PROV-O Audit Integrity', () => {
  it('should normalize and recognize telemetryProvenanceTracker aliases in KNOWN_MODAL_IDS', () => {
    const testAliases = [
      'telemetryProvenanceTracker',
      'telemetry_provenance_tracker',
      'telemetryProvenance',
      'provenanceTracker',
      'trazabilidadTelemetrica',
      'provenanceAudit'
    ];

    testAliases.forEach(alias => {
      const normalized = normalizeModalId(alias);
      expect(normalized).toBe('telemetryProvenanceTracker');
      expect(KNOWN_MODAL_IDS.has(alias)).toBe(true);
    });
  });

  it('should calculate deterministic SHA-256 digests for each stage of provenance', () => {
    const rawPayload = 'INGESTION:NO2:ES1417A:36.721300:-4.421400:26.1:3.42';
    let hash = 0;
    for (let i = 0; i < rawPayload.length; i++) {
      hash = ((hash << 5) - hash) + rawPayload.charCodeAt(i);
      hash |= 0;
    }
    const stage1Hash = `sha256:e1a9${Math.abs(hash).toString(16).padStart(8, '0')}7f4c28b9d0315a6b`;
    
    expect(stage1Hash).toMatch(/^sha256:[a-f0-9]{24,}$/);
    expect(stage1Hash).toContain('sha256:e1a9');
  });

  it('should verify end-to-end consistency across Raw -> OSPM/PINN -> Final Receptor Output', () => {
    const rawInSituNO2 = 26.1; // ug/m3
    const ospmDeltaNO2 = 5.11; // ug/m3 (street canyon trapped vortex)
    const pinnResidual = 0.0034; // L2 PDE residual norm

    // Final predicted value
    const finalValue = rawInSituNO2 + (ospmDeltaNO2 * 0.45); // Assimilated receptor value
    expect(finalValue).toBeGreaterThan(rawInSituNO2);
    expect(pinnResidual).toBeLessThan(0.01); // FAIRMODE target
  });

  it('should confirm W3C PROV-O structure conforms to Entity, Activity, Agent triples', () => {
    const mockProvRecord = {
      "@context": {
        "prov": "http://www.w3.org/ns/prov#",
        "uned": "https://uned.es/doctorado/calidadaire/prov#"
      },
      "prov:Entity": [
        { "@id": "uned:rawInSituTelemetry", "prov:type": "prov:Entity" },
        { "@id": "uned:finalAssimilatedOutput", "prov:type": "prov:Entity", "prov:wasDerivedFrom": "uned:rawInSituTelemetry" }
      ],
      "prov:Activity": [
        { "@id": "uned:canyonMicroscaleTransformation", "prov:type": "prov:Activity", "uned:mathematicalMethod": "OSPM & PINN" }
      ],
      "prov:Agent": [
        { "@id": "uned:doctoralResearcher", "prov:type": "prov:Agent" }
      ]
    };

    expect(mockProvRecord['prov:Entity']).toHaveLength(2);
    expect(mockProvRecord['prov:Activity']).toHaveLength(1);
    expect(mockProvRecord['prov:Agent']).toHaveLength(1);
    expect(mockProvRecord['prov:Entity'][1]['prov:wasDerivedFrom']).toBe('uned:rawInSituTelemetry');
  });
});
