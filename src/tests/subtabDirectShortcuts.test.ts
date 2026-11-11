import { describe, it, expect } from 'vitest';
import { SCIENTIFIC_SUBTABS_CATALOG, getSubtabShortcut } from '../lib/scientificSubtabsRegistry';
import { normalizeModalId } from '../components/ScientificModalRegistry';
import { DEFAULT_PINNED_SHORTCUTS, useUIStore } from '../store/uiStore';
import { SCIENTIFIC_CATEGORIES } from '../components/IntelligentDockTabs';

describe('Mejora 1: Fijación y Acceso Directo a Subpestañas Exactas', () => {
  it('1. El catálogo de subpestañas científicas debe estar exhaustivamente poblado y libre de duplicados', () => {
    expect(SCIENTIFIC_SUBTABS_CATALOG.length).toBeGreaterThanOrEqual(18);
    
    const ids = new Set<string>();
    for (const sub of SCIENTIFIC_SUBTABS_CATALOG) {
      expect(sub.id).toContain(':');
      expect(sub.modalId).toBeTruthy();
      expect(sub.subtabId).toBeTruthy();
      expect(sub.title).toBeTruthy();
      expect(sub.shortTag).toBeTruthy();
      expect(sub.parentSuiteName).toBeTruthy();
      expect(sub.categoryName).toBeTruthy();
      expect(sub.description).toBeTruthy();
      expect(ids.has(sub.id)).toBe(false);
      ids.add(sub.id);
    }
  });

  it('2. getSubtabShortcut debe recuperar correctamente los metadatos de cualquier cálculo exacto', () => {
    const sounding = getSubtabShortcut('unifiedCanyonSuite:vertical_profile');
    expect(sounding).toBeDefined();
    expect(sounding?.title).toBe('Sondeo Vertical en Cañón 0-50 m (OSPM)');
    expect(sounding?.formula).toContain('C(z)');

    const leighton = getSubtabShortcut('scientificAtlas:leighton_photostationary');
    expect(leighton).toBeDefined();
    expect(leighton?.shortTag).toBe('CICLO LEIGHTON');

    const sobol = getSubtabShortcut('scientificAtlas:sobol_sensitivity_analysis');
    expect(sobol).toBeDefined();
    expect(sobol?.shortTag).toBe('SENSIBILIDAD SOBOL');

    const icrp = getSubtabShortcut('populationExposure:pediatric_icrp66');
    expect(icrp).toBeDefined();
    expect(icrp?.shortTag).toBe('DOSIMETRÍA ICRP 66');
  });

  it('3. normalizeModalId debe preservar la notación con dos puntos (colon notation) y resolver alias de base', () => {
    expect(normalizeModalId('unifiedCanyonSuite:vertical_profile')).toBe('unifiedCanyonSuite:vertical_profile');
    expect(normalizeModalId('extendedLeighton:radicals_oxidation')).toBe('leighton:radicals_oxidation');
    expect(normalizeModalId('audit:live')).toBe('stationAudit:live');
    expect(normalizeModalId('copertTraffic:speed_curves')).toBe('copert:speed_curves');
  });

  it('4. DEFAULT_PINNED_SHORTCUTS debe incluir subpestañas exactas de alta prioridad doctoral', () => {
    expect(DEFAULT_PINNED_SHORTCUTS).toContain('unifiedCanyonSuite:vertical_profile');
    expect(DEFAULT_PINNED_SHORTCUTS).toContain('scientificAtlas:leighton_photostationary');
    expect(DEFAULT_PINNED_SHORTCUTS).toContain('scientificAtlas:sobol_sensitivity_analysis');
    expect(DEFAULT_PINNED_SHORTCUTS).toContain('populationExposure:pediatric_icrp66');
  });

  it('5. useUIStore debe permitir fijar, desfijar y conmutar subpestañas exactas dinámicamente', () => {
    const store = useUIStore.getState();
    const testSubtabId = 'scientificAtlas:gum_uncertainty_budget';

    // Agregar atajo de subpestaña
    store.addPinnedShortcut(testSubtabId);
    expect(useUIStore.getState().pinnedShortcuts).toContain(testSubtabId);

    // Conmutar para remover
    store.togglePinnedShortcut(testSubtabId);
    expect(useUIStore.getState().pinnedShortcuts).not.toContain(testSubtabId);

    // Conmutar para agregar de nuevo
    store.togglePinnedShortcut(testSubtabId);
    expect(useUIStore.getState().pinnedShortcuts).toContain(testSubtabId);

    // Limpieza
    store.removePinnedShortcut(testSubtabId);
    expect(useUIStore.getState().pinnedShortcuts).not.toContain(testSubtabId);
  });
});
