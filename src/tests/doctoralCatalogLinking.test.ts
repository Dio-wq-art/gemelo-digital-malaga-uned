import { describe, it, expect } from 'vitest';
import { SCIENTIFIC_SUBTABS_CATALOG, getSubtabShortcut } from '../lib/scientificSubtabsRegistry';
import { SCIENTIFIC_CATEGORIES } from '../components/IntelligentDockTabs';
import { normalizeModalId } from '../components/ScientificModalRegistry';

describe('Auditoría Integral del Catálogo Doctoral: Pantallas, Subpantallas y Sub-subpantallas', () => {
  it('1. Todas las pantallas (módulos principales) del catálogo deben tener identificadores únicos y válidos', () => {
    const allModules = SCIENTIFIC_CATEGORIES.flatMap(c => c.modules);
    expect(allModules.length).toBeGreaterThanOrEqual(70);

    const ids = new Set<string>();
    for (const mod of allModules) {
      expect(mod.id).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(mod.tag).toBeTruthy();
      expect(mod.description).toBeTruthy();
      expect(ids.has(mod.id)).toBe(false);
      ids.add(mod.id);
    }
  });

  it('2. Todas las subpantallas y sub-subpantallas deben tener formato modalId:subtabId sin enlaces huérfanos', () => {
    expect(SCIENTIFIC_SUBTABS_CATALOG.length).toBeGreaterThanOrEqual(60);

    const subIds = new Set<string>();
    const parentModalIds = new Set(SCIENTIFIC_CATEGORIES.flatMap(c => c.modules.map(m => m.id)));

    for (const sub of SCIENTIFIC_SUBTABS_CATALOG) {
      expect(sub.id).toContain(':');
      const [modalId, subtabId] = sub.id.split(':');
      expect(modalId).toBe(sub.modalId);
      expect(subtabId).toBe(sub.subtabId);
      expect(sub.title).toBeTruthy();
      expect(sub.shortTag).toBeTruthy();
      expect(sub.parentSuiteName).toBeTruthy();
      expect(sub.categoryName).toBeTruthy();

      // Verificar que el modal padre esté en el catálogo o sea un alias canónico
      const normModal = normalizeModalId(modalId).split(':')[0];
      const hasDirectParent = parentModalIds.has(modalId) || parentModalIds.has(normModal);
      expect(hasDirectParent).toBe(true);

      expect(subIds.has(sub.id)).toBe(false);
      subIds.add(sub.id);
    }
  });

  it('3. Las subpantallas clave de doctorado recién incorporadas deben estar activas y con fórmulas rigurosas', () => {
    const pinnEq = getSubtabShortcut('thesisMethodologySuite:pinn_equations');
    expect(pinnEq).toBeDefined();
    expect(pinnEq?.formula).toContain('w_terr');

    const justice5D = getSubtabShortcut('environmentalJustice:frontier_5d_compound');
    expect(justice5D).toBeDefined();
    expect(justice5D?.formula).toContain('CHPS');

    const schoolDose = getSubtabShortcut('schoolAirEquity:dosimetry');
    expect(schoolDose).toBeDefined();
    expect(schoolDose?.formula).toContain('V_E');

    const treeStreets = getSubtabShortcut('malagaTreesInventory:streets');
    expect(treeStreets).toBeDefined();
    expect(treeStreets?.formula).toContain('GS-GOGAT');

    const cumLaude = getSubtabShortcut('thesisMethodologySuite:cum_laude_defense');
    expect(cumLaude).toBeDefined();
    expect(cumLaude?.formula).toContain('FAIRMODE MQI');
  });
});
