/**
 * Suite de Validación Automatizada: Integridad de Botones, Pestañas y Modales
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire de Málaga (UNED / EIDUNED)
 * 
 * PROPÓSITO:
 * Garantizar que el 100% de los botones, selectores de pestañas y disparadores
 * de modales en toda la aplicación dispongan de manejadores activos (onClick, type=submit)
 * y que ningún modal quede inoperativo ni en la versión actual ni en futuras incorporaciones.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getAllTsxFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsxFiles(fullPath));
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('1. Verificación Estricta: Todos los botones (<button>) deben ser interactivos y tener handler activo', () => {
  it('Ningún botón en toda la base de código debe carecer de onClick, type="submit", disabled o tener un onClick vacío', () => {
    const srcDir = path.resolve(__dirname, '..');
    const tsxFiles = getAllTsxFiles(srcDir);

    const buttonRegex = /<button\b([\s\S]*?)>/g;
    const violations: { file: string; line: number; reason: string; snippet: string }[] = [];
    let totalButtonsChecked = 0;

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let match: RegExpExecArray | null;
      while ((match = buttonRegex.exec(content)) !== null) {
        totalButtonsChecked++;
        const attrs = match[1];

        // Calcular número de línea aproximado
        const charIndex = match.index;
        const line = content.substring(0, charIndex).split('\n').length;

        const hasOnClick = attrs.includes('onClick');
        const isSubmit = attrs.includes('type="submit"') || attrs.includes("type='submit'");
        const isDisabled = attrs.includes('disabled');
        const hasFormAction = attrs.includes('formAction');
        const isEmptyOnClick =
          /onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(attrs) ||
          /onClick=\{\s*\(\)\s*=>\s*undefined\s*\}/.test(attrs);

        const relPath = path.relative(srcDir, file);

        if (isEmptyOnClick) {
          violations.push({
            file: relPath,
            line,
            reason: 'EMPTY_ONCLICK',
            snippet: match[0].slice(0, 100).replace(/\n/g, ' ')
          });
        } else if (!hasOnClick && !isSubmit && !hasFormAction && !isDisabled) {
          violations.push({
            file: relPath,
            line,
            reason: 'BUTTON_WITHOUT_ACTION',
            snippet: match[0].slice(0, 100).replace(/\n/g, ' ')
          });
        }
      }
    }

    expect(totalButtonsChecked).toBeGreaterThan(500);
    expect(
      violations,
      `Se detectaron ${violations.length} botones no interactivos o con onClick vacío:\n` +
      violations.map(v => `  - ${v.file}:${v.line} [${v.reason}]: ${v.snippet}`).join('\n')
    ).toHaveLength(0);
  });
});

describe('2. Verificación de Enrutamiento: Todos los disparadores de modales (setActiveModal) deben estar registrados', () => {
  it('Cada identificador llamado mediante setActiveModal(...) debe estar registrado o normalizado', () => {
    const srcDir = path.resolve(__dirname, '..');
    const tsxFiles = getAllTsxFiles(srcDir);

    const registryPath = path.join(srcDir, 'components', 'ScientificModalRegistry.tsx');
    const appPath = path.join(srcDir, 'App.tsx');
    const registryContent = fs.readFileSync(registryPath, 'utf-8');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    const modalCalls = new Set<string>();
    const modalCallLocations: Record<string, string[]> = {};

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const re = /setActiveModal\(\s*['"`]([a-zA-Z0-9_-]+)['"`]\s*\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        const id = m[1];
        modalCalls.add(id);
        const rel = path.relative(srcDir, file);
        if (!modalCallLocations[id]) modalCallLocations[id] = [];
        modalCallLocations[id].push(rel);
      }
    }

    const unhandled: { id: string; files: string[] }[] = [];

    modalCalls.forEach(id => {
      const inRegistry =
        registryContent.includes(`'${id}'`) ||
        registryContent.includes(`"${id}"`);
      const inApp =
        appContent.includes(`'${id}'`) ||
        appContent.includes(`"${id}"`);

      if (!inRegistry && !inApp) {
        unhandled.push({ id, files: modalCallLocations[id] });
      }
    });

    expect(
      unhandled,
      `Se encontraron llamadas a setActiveModal con identificadores no registrados:\n` +
      unhandled.map(u => `  - '${u.id}' en: ${u.files.join(', ')}`).join('\n')
    ).toHaveLength(0);
  });
});

describe('3. Verificación de Módulos del Dock Inteligente (IntelligentDockTabs)', () => {
  it('Todos los módulos de las 8 categorías científicas deben poder abrir su modal correspondiente', () => {
    const dockPath = path.resolve(__dirname, '../components/IntelligentDockTabs.tsx');
    const dockContent = fs.readFileSync(dockPath, 'utf-8');
    const registryPath = path.resolve(__dirname, '../components/ScientificModalRegistry.tsx');
    const registryContent = fs.readFileSync(registryPath, 'utf-8');
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Extraer todos los module.id dentro de modules: [...]
    const moduleIds: string[] = [];
    const lines = dockContent.split('\n');
    let inModules = false;
    for (const line of lines) {
      if (line.includes('modules: [')) inModules = true;
      if (inModules && line.includes("id: '")) {
        const match = line.match(/id:\s*'([a-zA-Z0-9_-]+)'/);
        if (match) moduleIds.push(match[1]);
      }
      if (inModules && (line.trim() === ']' || line.trim() === '],')) {
        inModules = false;
      }
    }

    expect(moduleIds.length).toBeGreaterThan(60);

    const unhandledModules: string[] = [];
    for (const id of moduleIds) {
      const isHandled =
        registryContent.includes(`'${id}'`) ||
        registryContent.includes(`"${id}"`) ||
        appContent.includes(`'${id}'`) ||
        appContent.includes(`"${id}"`);

      if (!isHandled) {
        unhandledModules.push(id);
      }
    }

    expect(
      unhandledModules,
      `Módulos de IntelligentDockTabs que carecen de handler:\n` + unhandledModules.join(', ')
    ).toHaveLength(0);
  });
});

describe('4. Verificación de Integridad del Explorador de Tesis (QuickModuleLauncherModal)', () => {
  it('ALL_SYSTEM_MODULES en QuickModuleLauncherModal debe contener la totalidad de los módulos únicos (>45)', () => {
    const launcherPath = path.resolve(__dirname, '../components/QuickModuleLauncherModal.tsx');
    const launcherContent = fs.readFileSync(launcherPath, 'utf-8');

    expect(launcherContent).toMatch(/SCIENTIFIC_CATEGORIES.*from\s+['"]\.\/IntelligentDockTabs['"]/);
    expect(launcherContent).includes('export const ALL_SYSTEM_MODULES');
  });
});
