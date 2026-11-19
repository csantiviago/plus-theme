#!/usr/bin/env node
// Valida o tema com o validador REAL do Actual (customThemes.ts), do mesmo
// jeito que o app faz ao instalar pelo catálogo, e confere se o tema cobre
// todas as variáveis --color-* dos temas embutidos.
//
//   node scripts/validate.mjs                 versão suportada (SUPPORTED_REF); bloqueante no CI
//   node scripts/validate.mjs --compat        master; checagem de compatibilidade, separada
//   ACTUAL_REF=<tag|branch|sha> node ...      qualquer outra referência
//
// Falha é falha: o modo --compat sai com código 1 se o master quebrar o tema
// ou trouxer variáveis novas sem mapeamento. Quem decide se isso bloqueia é o
// CI (job separado), não este script.
//
// Requer Node ≥ 22.18 (type stripping de TypeScript sem flag).

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SUPPORTED_REF = 'v26.10.0';
const compat = process.argv.includes('--compat');
const ref = process.env.ACTUAL_REF || (compat ? 'master' : SUPPORTED_REF);
console.log(`Actual @ ${ref} (${ref === SUPPORTED_REF ? 'versão suportada' : 'compatibilidade, não é a versão suportada'})`);
const raw = p => `https://raw.githubusercontent.com/actualbudget/actual/${ref}/${p}`;

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

const dir = mkdtempSync(join(tmpdir(), 'actual-theme-'));
const modPath = join(dir, 'customThemes.ts');
writeFileSync(
  modPath,
  await get(raw('packages/desktop-client/src/style/customThemes.ts')),
);
const { validateThemeCss, embedThemeFonts } = await import(pathToFileURL(modPath).href);

let failed = false;
const ok = msg => console.log(`✓ ${msg}`);
const fail = msg => {
  console.error(`✗ ${msg}`);
  failed = true;
};

// 1. Instalação pelo repositório: o Actual baixa actual.css e embute as
//    fontes buscando fonts/*.woff2 no próprio repo. Aqui o fetch das fontes
//    é servido do disco.
const themeCss = readFileSync(join(root, 'actual.css'), 'utf8');
const realFetch = globalThis.fetch;
globalThis.fetch = async url => {
  const m = String(url).match(/refs\/heads\/main\/(.+)$/);
  if (!m) return realFetch(url);
  return new Response(readFileSync(join(root, m[1])));
};
try {
  const embedded = await embedThemeFonts(themeCss, 'csantiviago/plus-theme');
  validateThemeCss(embedded);
  ok('actual.css passa no validador (com fontes embutidas)');
} catch (e) {
  fail(`actual.css: ${e.message}`);
} finally {
  globalThis.fetch = realFetch;
}

// 2. Colar em "Additional CSS overrides".
const overrideCss = readFileSync(join(root, 'dist/plus-override.css'), 'utf8');
try {
  validateThemeCss(overrideCss);
  ok('dist/plus-override.css passa no validador');
} catch (e) {
  fail(`dist/plus-override.css: ${e.message}`);
}

// 3. Cobertura: toda variável dos temas embutidos precisa estar definida,
//    senão ela cai no valor do tema-base (dark) e destoa.
const names = css => new Set(css.match(/--color-[A-Za-z0-9]+(?=\s*:)/g));
const ours = names(themeCss);
const base = await baseVariables();
const missing = [...base].filter(n => !ours.has(n));
const extra = [...ours].filter(n => !base.has(n));
if (missing.length) fail(`faltam ${missing.length} variáveis: ${missing.join(', ')}`);
else ok(`cobre as ${base.size} variáveis --color-* dos temas embutidos`);
if (extra.length) {
  console.warn(`! variáveis do tema ausentes nesta versão do Actual (ignoradas): ${extra.join(', ')}`);
}

process.exit(failed ? 1 : 0);

// Variáveis --color-* dos temas embutidos. Até a v26.10 elas vinham de
// themes/{light,dark,midnight}.css; depois o Actual passou a gerar esses
// arquivos a partir de themes/source/colors.ts (um token por chave, emitido
// como --color-<chave> em todos os temas).
async function baseVariables() {
  const themes = 'packages/component-library/src/themes';
  const css = await Promise.all(
    ['light', 'dark', 'midnight'].map(t =>
      fetch(raw(`${themes}/${t}.css`)).then(r => (r.ok ? r.text() : null)),
    ),
  );
  if (css.every(c => c != null)) return new Set(css.flatMap(c => [...names(c)]));

  const path = join(dir, 'colors.ts');
  writeFileSync(path, await get(raw(`${themes}/source/colors.ts`)));
  const { colors } = await import(pathToFileURL(path).href);
  return new Set(Object.keys(colors).map(k => `--color-${k}`));
}
