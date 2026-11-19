#!/usr/bin/env node
// Gera actual.css (formato de tema do Actual Budget) e
// dist/plus-override.css (mesmo tema com as fontes embutidas, para
// colar em Configurações → Temas → "Additional CSS overrides").
//
// Fonte da verdade: os tokens abaixo. Mude aqui, rode
// `node scripts/build.mjs` e faça commit dos dois arquivos gerados.
//
//   node scripts/build.mjs          gera
//   node scripts/build.mjs --check  falha se os arquivos gerados estão velhos

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ─── Tokens da paleta ─────────────────────────────────────────────────────
const pal = {
  bg: '#0f1420',
  surface: '#0c1120',
  surface2: '#161d2e',
  surface3: '#1a2338',
  border: '#1e293e',
  border2: '#263450',
  border3: '#314060',

  text: '#dde6f2',
  text2: '#a8b5c8',
  muted: '#899fbe',
  white: '#ffffff',

  navTxt: '#7392b8',
  navActive: '#c0d4f0',

  accent: '#6f8bfa',
  accentH: '#a7b7ff',

  green: '#22c55e',
  greenL: '#4ade80',
  amber: '#f59e0b',
  amberL: '#fbbf24',
  amberTxt: '#fcd34d',
  red: '#ef4444',
  redH: '#f87171',
  redTxt: '#fca5a5',

  // Paleta categórica — validada para daltonismo (CVD).
  catBlue: '#5b8bf7',
  catMagenta: '#c25fb5',
  catViolet: '#8b6fc7',
  catGreen: '#219e68',
  catGold: '#bd8226',
  teal: '#2dd4bf',
};

const font =
  "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// O validador de tema do Actual não aceita color-mix(); a tinta translúcida
// (accent-bg, green-bg…) vira cor opaca misturada sobre a
// superfície onde ela aparece.
function mix(fg, bg, alpha) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(fg), p(bg)];
  return (
    '#' +
    a
      .map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)))
      .map(c => c.toString(16).padStart(2, '0'))
      .join('')
  );
}

const rgba = (hex, alpha) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const accentSoft = mix(pal.accent, pal.surface2, 0.16); // linha selecionada
const accentMid = mix(pal.accent, pal.surface2, 0.3);
const accentStrong = mix(pal.accent, pal.surface2, 0.5);

// ─── Mapeamento para as variáveis do Actual ──────────────────────────────
// Ordem e agrupamento seguem packages/component-library/src/themes/dark.css.
const sections = [
  [
    'Tipografia',
    {
      'font-family': font,
    },
  ],
  [
    'Página',
    {
      pageBackground: pal.bg,
      pageBackgroundModalActive: pal.surface,
      pageBackgroundTopLeft: pal.surface2,
      pageBackgroundBottomRight: pal.surface,
      pageBackgroundLineTop: pal.accent,
      pageBackgroundLineMid: pal.surface,
      pageBackgroundLineBottom: pal.border3,
      pageText: pal.text,
      pageTextLight: pal.text2,
      pageTextSubdued: pal.muted,
      pageTextDark: '#eef3fa',
      pageTextPositive: pal.accentH,
      pageTextLink: pal.accent,
      pageTextLinkLight: pal.accentH,
    },
  ],
  [
    'Cards',
    {
      cardBackground: pal.surface2,
      cardBorder: pal.border2,
      cardShadow: '#070a12',
    },
  ],
  [
    'Tabelas',
    {
      tableBackground: pal.surface2,
      tableRowBackgroundAlternate: 'var(--color-tableBackground)',
      tableRowBackgroundHover: pal.surface3,
      tableText: pal.text,
      tableTextItemAdded: 'var(--color-tableText)',
      tableTextLight: 'var(--color-tableText)',
      tableTextSubdued: pal.muted,
      tableTextSelected: pal.text,
      tableTextHover: pal.text2,
      tableTextInactive: pal.muted,
      tableHeaderText: pal.text2,
      tableHeaderBackground: pal.surface3,
      tableBorder: pal.border,
      tableBorderSelected: pal.accent,
      tableBorderHover: pal.accentH,
      tableBorderSeparator: pal.border3,
      tableRowBackgroundHighlight: accentSoft,
      tableRowBackgroundHighlightText: pal.text,
      tableRowHeaderBackground: pal.surface3,
      tableRowHeaderText: pal.text,
    },
  ],
  [
    'Números (verde entra, vermelho sai)',
    {
      numberPositive: pal.greenL,
      numberNegative: pal.redH,
      numberNeutral: pal.muted,
      budgetNumberNegative: 'var(--color-numberNegative)',
      budgetNumberZero: 'var(--color-tableTextSubdued)',
      budgetNumberNeutral: 'var(--color-tableText)',
      budgetNumberPositive: 'var(--color-budgetNumberNeutral)',
      templateNumberFunded: 'var(--color-numberPositive)',
      templateNumberUnderFunded: pal.amberL,
      toBudgetPositive: 'var(--color-numberPositive)',
      toBudgetZero: 'var(--color-numberPositive)',
      toBudgetNegative: 'var(--color-budgetNumberNegative)',
    },
  ],
  [
    'Sidebar',
    {
      sidebarBackground: pal.surface,
      sidebarItemBackgroundPending: pal.amber,
      sidebarItemBackgroundPositive: pal.green,
      sidebarItemBackgroundFailed: pal.red,
      sidebarItemAccentSelected: pal.accent,
      sidebarItemBackgroundHover: rgba('#ffffff', 0.04),
      sidebarItemBackgroundSelected: rgba(pal.accent, 0.12),
      sidebarItemText: pal.navTxt,
      sidebarItemTextUpdated: 'var(--color-sidebarItemText)',
      sidebarItemTextSelected: pal.navActive,
      sidebarBudgetName: pal.text2,
      sidebarHeaderText: pal.text,
      sidebarTextSubdued: pal.muted,
      sidebarTextMuted: pal.navTxt,
      sidebarTextPositive: pal.greenL,
      sidebarTextFailed: pal.redH,
      sidebarBackgroundFailedSubtle: rgba(pal.red, 0.16),
      sidebarBorder: rgba('#ffffff', 0.07),
      sidebarControlBackground: pal.surface2,
      sidebarBrand: pal.accent,
    },
  ],
  [
    'Menus e autocomplete',
    {
      menuBackground: pal.surface3,
      menuItemBackground: pal.surface3,
      menuItemBackgroundHover: pal.border2,
      menuItemText: pal.text,
      menuItemTextHover: pal.white,
      menuItemTextSelected: pal.accentH,
      menuItemTextHeader: pal.muted,
      menuBorder: pal.border2,
      menuBorderHover: pal.accent,
      menuKeybindingText: pal.muted,
      menuAutoCompleteBackground: pal.surface2,
      menuAutoCompleteBackgroundHover: pal.border2,
      menuAutoCompleteText: pal.text,
      menuAutoCompleteTextHover: pal.accentH,
      menuAutoCompleteTextHeader: pal.muted,
      menuAutoCompleteItemText: 'var(--color-menuItemText)',
      menuAutoCompleteItemTextHover: pal.white,
    },
  ],
  [
    'Modais e mobile',
    {
      modalBackground: pal.surface2,
      modalBorder: pal.border2,
      mobileHeaderBackground: pal.surface,
      mobileHeaderText: pal.text,
      mobileHeaderTextSubdued: pal.text2,
      mobileHeaderTextHover: rgba('#ffffff', 0.08),
      mobilePageBackground: pal.bg,
      mobileNavBackground: pal.surface,
      mobileNavItem: pal.navTxt,
      mobileNavItemSelected: pal.accent,
      mobileAccountShadow: 'var(--color-cardShadow)',
      mobileAccountText: pal.accentH,
      mobileTransactionSelected: pal.accent,
      mobileViewTheme: 'var(--color-mobileHeaderBackground)',
      mobileConfigServerViewTheme: pal.surface,
    },
  ],
  [
    'Markdown',
    {
      markdownNormal: accentMid,
      markdownDark: accentStrong,
      markdownLight: accentSoft,
    },
  ],
  [
    'Botões',
    {
      buttonMenuText: pal.text2,
      buttonMenuTextHover: pal.text,
      buttonMenuBackground: 'transparent',
      buttonMenuBackgroundHover: rgba('#ffffff', 0.06),
      buttonMenuBorder: pal.border3,
      buttonMenuSelectedText: pal.bg,
      buttonMenuSelectedTextHover: pal.bg,
      buttonMenuSelectedBackground: pal.accent,
      buttonMenuSelectedBackgroundHover: pal.accentH,
      buttonMenuSelectedBorder: 'var(--color-buttonMenuSelectedBackground)',

      // Tinta escura sobre a marca: branco sobre --accent dá 3,1:1 (reprova
      // AA); --bg dá 5,9:1. Tinta escura sobre o acento.
      buttonPrimaryText: pal.bg,
      buttonPrimaryTextHover: 'var(--color-buttonPrimaryText)',
      buttonPrimaryBackground: pal.accent,
      buttonPrimaryBackgroundHover: pal.accentH,
      buttonPrimaryBorder: 'var(--color-buttonPrimaryBackground)',
      buttonPrimaryShadow: rgba('#000000', 0.35),
      buttonPrimaryDisabledText: pal.navTxt,
      buttonPrimaryDisabledBackground: pal.border,
      buttonPrimaryDisabledBorder: 'var(--color-buttonPrimaryDisabledBackground)',

      buttonNormalText: pal.text,
      buttonNormalTextHover: pal.white,
      buttonNormalBackground: pal.surface3,
      buttonNormalBackgroundHover: pal.border2,
      buttonNormalBorder: pal.border3,
      buttonNormalShadow: rgba('#000000', 0.3),
      buttonNormalSelectedText: pal.bg,
      buttonNormalSelectedBackground: pal.accent,
      buttonNormalDisabledText: pal.navTxt,
      buttonNormalDisabledBackground: pal.surface2,
      buttonNormalDisabledBorder: pal.border2,

      buttonBareText: 'var(--color-pageText)',
      buttonBareTextHover: 'var(--color-pageText)',
      buttonBareDisabledText: 'var(--color-pageTextSubdued)',
      buttonBareBackground: 'transparent',
      buttonBareDisabledBackground: 'var(--color-buttonBareBackground)',
      buttonBareBackgroundHover: rgba('#ffffff', 0.06),
      buttonBareBackgroundActive: rgba('#ffffff', 0.1),
    },
  ],
  [
    'Calendário',
    {
      calendarText: pal.text,
      calendarBackground: pal.surface,
      calendarItemText: pal.text,
      calendarItemBackground: pal.surface2,
      calendarSelectedBackground: 'var(--color-buttonNormalSelectedBackground)',
      calendarCellBackground: pal.surface,
      datePickerRangeBackground: accentMid,
    },
  ],
  [
    'Avisos (sucesso, alerta, erro, agendado)',
    {
      noticeBackground: mix(pal.green, pal.surface2, 0.12),
      noticeBackgroundLight: mix(pal.green, pal.surface2, 0.06),
      noticeBackgroundDark: pal.green,
      noticeText: pal.greenL,
      noticeTextLight: pal.green,
      noticeTextDark: '#bbf7d0',
      noticeTextMenu: pal.greenL,
      noticeTextMenuHover: '#86efac',
      noticeBorder: mix(pal.green, pal.surface2, 0.3),

      warningBackground: mix(pal.amber, pal.surface2, 0.12),
      warningText: pal.amberTxt,
      warningTextLight: pal.amberL,
      warningTextDark: '#fef3c7',
      warningBorder: mix(pal.amber, pal.surface2, 0.45),

      errorBackground: mix(pal.red, pal.surface2, 0.12),
      errorText: pal.redTxt,
      errorTextDark: '#fecaca',
      errorTextDarker: 'var(--color-errorTextDark)',
      errorTextMenu: pal.redTxt,
      errorBorder: mix(pal.red, pal.surface2, 0.45),

      upcomingBackground: accentSoft,
      upcomingText: pal.accentH,
      upcomingBorder: 'var(--color-tableBorder)',
    },
  ],
  [
    'Formulários',
    {
      formLabelText: pal.text2,
      formLabelBackground: pal.surface3,
      formInputBackground: pal.surface2,
      formInputBackgroundSelected: pal.surface3,
      formInputBackgroundSelection: pal.accent,
      formInputBorder: pal.border2,
      formInputTextReadOnlySelection: pal.surface2,
      formInputBorderSelected: pal.accent,
      formInputText: pal.text,
      formInputTextSelected: pal.bg,
      formInputTextPlaceholder: pal.muted,
      formInputTextPlaceholderSelected: pal.text2,
      formInputTextSelection: pal.surface2,
      formInputShadowSelected: rgba(pal.accent, 0.35),
      formInputTextHighlight: pal.accent,

      checkboxText: 'var(--color-tableText)',
      checkboxBackgroundSelected: pal.accent,
      checkboxBorderSelected: pal.accent,
      checkboxShadowSelected: rgba(pal.accent, 0.35),
      checkboxToggleBackground: pal.border3,
      checkboxToggleBackgroundSelected: pal.accent,
      checkboxToggleDisabled: pal.border2,
    },
  ],
  [
    'Pills',
    {
      pillBackground: pal.surface3,
      pillBackgroundLight: pal.surface2,
      pillText: pal.text2,
      pillTextHighlighted: pal.accentH,
      pillBorder: pal.border2,
      pillBorderDark: 'var(--color-pillBorder)',
      pillBackgroundSelected: accentMid,
      pillTextSelected: pal.text,
      pillBorderSelected: pal.accent,
      pillTextSubdued: pal.muted,
    },
  ],
  [
    'Relatórios',
    {
      reportsRed: pal.redH,
      reportsBlue: pal.accent,
      reportsGreen: pal.greenL,
      reportsGray: pal.muted,
      reportsLabel: 'var(--color-pageText)',
      reportsInnerLabel: pal.bg,
      reportsNumberPositive: 'var(--color-numberPositive)',
      reportsNumberNegative: 'var(--color-numberNegative)',
      reportsNumberNeutral: 'var(--color-numberNeutral)',
      reportsChartFill: 'var(--color-reportsNumberPositive)',
    },
  ],
  [
    'Tags de nota',
    {
      noteTagBackground: accentMid,
      noteTagBackgroundHover: accentStrong,
      noteTagDefault: accentMid,
      noteTagText: pal.text,
    },
  ],
  [
    'Orçamento (mês corrente × outros)',
    {
      budgetOtherMonth: pal.bg,
      budgetCurrentMonth: 'var(--color-tableBackground)',
      budgetHeaderOtherMonth: pal.surface2,
      budgetHeaderCurrentMonth: 'var(--color-tableHeaderBackground)',
    },
  ],
  [
    'Barra de ações, tooltip, overlay',
    {
      floatingActionBarBackground: pal.surface3,
      floatingActionBarBorder: pal.border2,
      floatingActionBarText: pal.text,
      tooltipText: pal.text,
      tooltipBackground: pal.surface3,
      tooltipBorder: pal.border2,
      overlayBackground: rgba('#000000', 0.45),
    },
  ],
  [
    // Variáveis que o Actual acrescentou depois da 26.10.0 (conferido no
    // master em 26/10/2026). Na versão suportada elas são ignoradas; no master
    // fazem a tela de Configurações seguir a paleta em vez de cair no dark
    // embutido. Semântica espelha packages/component-library/src/themes/dark.css.
    'Configurações (só em versões posteriores à 26.10.0)',
    {
      settingsCardBackground: 'var(--color-tableBackground)',
      settingsCardBorder: 'var(--color-tableBorder)',
      settingsCardText: 'var(--color-tableText)',
      settingsCardTextSubdued: pal.muted,
      settingsNavItemText: 'var(--color-pageText)',
      settingsNavItemBackgroundHover: rgba(pal.text, 0.08),
      settingsNavItemAccentSelected: pal.accentH,
      settingsNavItemTextSelected: 'var(--color-settingsNavItemAccentSelected)',
      settingsNavItemBackgroundSelected: rgba(pal.accentH, 0.22),
    },
  ],
  [
    'Gráficos — paleta categórica',
    {
      chartQual1: pal.catBlue,
      chartQual2: pal.catGreen,
      chartQual3: pal.catGold,
      chartQual4: pal.catMagenta,
      chartQual5: pal.catViolet,
      chartQual6: pal.teal,
      chartQual7: pal.redH,
      chartQual8: pal.amberL,
      chartQual9: pal.accentH,
    },
  ],
];

// ─── Saída ───────────────────────────────────────────────────────────────
const weights = [400, 500, 600, 700, 800];

// Faces reais para normal e italic: sem as itálicas o navegador sintetiza a
// inclinação (font-synthesis), que não tem os mesmos contornos nem métricas.
const styles = ['normal', 'italic'];
const fontFile = (style, w) =>
  `fonts/plus-jakarta-sans-${style === 'italic' ? 'italic-' : ''}${w}.woff2`;

function fontFaces(src) {
  return styles
    .flatMap(style => weights.map(w => [style, w]))
    .map(
      ([style, w]) => `@font-face {
  font-family: 'Plus Jakarta Sans';
  font-style: ${style};
  font-weight: ${w};
  font-display: swap;
  src: url('${src(style, w)}') format('woff2');
}`,
    )
    .join('\n');
}

function rootBlock() {
  const lines = [];
  for (const [title, vars] of sections) {
    if (lines.length) lines.push('');
    lines.push(`  /* ${title} */`);
    for (const [k, v] of Object.entries(vars)) {
      const name = k === 'font-family' ? '--font-family' : `--color-${k}`;
      lines.push(`  ${name}: ${v};`);
    }
  }
  return `:root {\n${lines.join('\n')}\n}\n`;
}

const header = `/*
 * Plus — tema para o Actual Budget
 * https://github.com/csantiviago/plus-theme
 *
 * Tema escuro azul-noite com acento cobalto-índigo e Plus Jakarta Sans.
 * Gerado por scripts/build.mjs — não edite à mão.
 */
`;

const themeCss =
  header + '\n' + fontFaces(fontFile) + '\n\n' + rootBlock();

const fontData = (style, w) =>
  'data:font/woff2;base64,' + readFileSync(join(root, fontFile(style, w))).toString('base64');

const overrideCss =
  header.replace(
    ' * Tema escuro',
    ' * Versão para colar em Configurações → Temas → "Additional CSS overrides"\n * (fontes embutidas). Tema escuro',
  ) +
  '\n' +
  fontFaces(fontData) +
  '\n\n' +
  rootBlock();

const outputs = {
  'actual.css': themeCss,
  'dist/plus-override.css': overrideCss,
};

if (process.argv.includes('--check')) {
  let stale = false;
  for (const [file, content] of Object.entries(outputs)) {
    let current = '';
    try {
      current = readFileSync(join(root, file), 'utf8');
    } catch {}
    if (current !== content) {
      console.error(`${file} está desatualizado — rode node scripts/build.mjs`);
      stale = true;
    }
  }
  process.exit(stale ? 1 : 0);
}

for (const [file, content] of Object.entries(outputs)) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), content);
  console.log(`${file}  ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}
