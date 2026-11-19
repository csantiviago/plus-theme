# Plus — tema para o Actual Budget

Tema escuro para o [Actual Budget](https://actualbudget.org): fundo azul-noite, acento
cobalto-índigo, **Plus Jakarta Sans** e uma regra simples de dinheiro (verde entra, vermelho sai).

![Orçamento com o tema Plus](screenshots/budget.png)

| Transações | Relatórios |
| --- | --- |
| ![Conta](screenshots/account.png) | ![Relatórios](screenshots/reports.png) |

Testado no Actual **26.10.0** (versão suportada, validação bloqueante no CI). Cobre as 237
variáveis `--color-*` dos temas embutidos e passa no validador oficial de temas do Actual. Uma
checagem separada confere a compatibilidade com o `master` (ver [Versões](#versões-validadas)).

## Instalar

O Actual só instala pelo repositório os temas que estão no catálogo oficial. Até este entrar
lá, o caminho é colar o CSS:

1. Abra [`dist/plus-override.css`](dist/plus-override.css) e copie tudo
   ([raw](https://raw.githubusercontent.com/csantiviago/plus-theme/main/dist/plus-override.css)).
   As fontes já vão embutidas nele.
2. No Actual: **Settings → Themes**, escolha **Dark** (ou **System default**, que usa o tema
   escuro à noite).
3. No seletor de tema escuro, escolha **Custom theme**.
4. Em **Additional CSS overrides**, cole o CSS e clique em **Apply**.

Para desfazer: apague o texto da caixa e clique em **Apply**. Instalando pelo catálogo, o Actual
baixa `actual.css` e as fontes do repositório sozinho.

> O override vale para qualquer tema, inclusive o Light. Como o tema só tem paleta escura,
> use com o tema escuro — no Light você terá um Light com cara de Dark.

### Pelo catálogo

Quando o tema estiver no catálogo: **Settings → Themes → Custom theme** e clique em
**Plus**. A entrada proposta para `customThemeCatalog.json` é:

```json
{
  "name": "Plus",
  "repo": "csantiviago/plus-theme",
  "colors": ["#0f1420", "#161d2e", "#6f8bfa", "#dde6f2", "#4ade80", "#f87171"],
  "mode": "dark"
}
```

## O que muda

| Papel | Cor | Variáveis do Actual |
| --- | --- | --- |
| Fundo | `#0f1420` | `pageBackground`, `mobilePageBackground` |
| Superfície (cards, tabelas, modais) | `#161d2e` | `tableBackground`, `cardBackground`, `modalBackground` |
| Superfície elevada | `#1a2338` | `tableHeaderBackground`, `menuBackground`, `tooltipBackground` |
| Sidebar | `#0c1120` | `sidebarBackground`, `mobileNavBackground` |
| Bordas | `#1e293e` / `#263450` / `#314060` | `tableBorder`, `menuBorder`, `buttonNormalBorder` |
| Texto | `#dde6f2` / `#a8b5c8` / `#899fbe` | `pageText`, `pageTextLight`, `pageTextSubdued` |
| Acento | `#6f8bfa` (hover `#a7b7ff`) | `buttonPrimaryBackground`, `pageTextLink`, seleções |
| Entrou / saiu | `#4ade80` / `#f87171` | `numberPositive`, `numberNegative` |
| Alerta | `#fbbf24` | `warning*`, `templateNumberUnderFunded` |
| Gráficos | paleta categórica validada para daltonismo | `chartQual1`–`chartQual9` |
| Fonte | Plus Jakarta Sans 400–800, normal e itálico | `--font-family`, `@font-face` |

Botão primário usa tinta escura sobre o acento: branco sobre `#6f8bfa` dá
3,1:1 e reprova AA; `#0f1420` dá 5,9:1.

## Itálico

O Actual mostra em itálico as transações agendadas (previews) e alguns rótulos. Sem faces itálicas o
navegador **sintetiza** a inclinação; por isso o tema traz faces `italic` reais
(400–800, ver [`fonts/FONTS.md`](fonts/FONTS.md) para origem, versão e licença).

![normal × itálico sintético × itálico real](docs/comparacao-italico.png)

### O que foi medido (e o que não foi)

Os testes usam uma fixture com o DOM/CSS das células de transação do Actual v26.10.0 (`overflow:
hidden` no texto e no wrapper do payee). **Não é o Actual completo.** Medido no Chromium, tamanho 13 px,
contando píxeis de tinta que só aparecem sem o recorte:

- Valores em itálico (`1.900,00`, `120,00`): o corte do último dígito (4–6 px) **some** (0 px).
- Nomes: o corte diminui (ex.: Netflix 3→1 px, Stuff 4→1 px, Fast Internet 1→0 px), mas **não some em
  todos** (ex.: "juros" continua com 3 px). Fonte real não garante que todo corte desapareça.
- O estilo normal fica idêntico pixel a pixel.
- `1.234.567,89` em coluna estreita (80 px) leva reticências com ou sem itálico: é corte por largura
  da coluna (o Actual estima ~7 px por caractere), não de fonte.

Firefox foi conferido só manualmente; WebKit/Safari não foi testado. Devices com
`deviceScaleFactor` maior medem densidade de pixels, não zoom de interface.

### Limites do formato de tema

O formato nativo do Actual aceita só `@font-face` e variáveis em `:root`; o validador rejeita
seletores. Por isso o tema **não** acrescenta `padding`, `overflow` ou regras por componente — e
não deve: remover `overflow` globalmente poderia sobrepor colunas. Se o corte residual precisar de
folga interna, a correção é no componente do Actual (ou numa camada de CSS externa fora do formato
de tema), não aqui. Também não é o tema que decide as reticências: elas vêm do `text-overflow` do
Actual.

## Limitações

- Realces e hovers com alpha (`sidebarItemBackgroundSelected`, `settingsNavItemBackground*`…) usam
  `rgba()` ou cor opaca misturada sobre a superfície; o validador do Actual não aceita `color-mix()`.
- `chartQual1`–`chartQual9` definem a paleta dos gráficos, mas é o Actual que decide qual categoria
  recebe qual cor.

## Versões validadas

| Checagem | Referência | Comportamento no CI |
| --- | --- | --- |
| `node scripts/validate.mjs` | Actual **v26.10.0** | bloqueante |
| `node scripts/validate.mjs --compat` | `master` | job separado, não obrigatório; **falha de verdade** se o master quebrar o tema ou trouxer variáveis sem mapeamento |

O tema já define as 9 variáveis `--color-settings*` que o `master` acrescentou (na 26.10.0 elas são
ignoradas). No `master`, as cores dos temas embutidos vêm de `themes/source/colors.ts`; o
`validate.mjs` lê esse arquivo quando os `.css` antigos não existem. As 13 variáveis que o `master`
removeu continuam no tema e são ignoradas lá; a checagem de compatibilidade passa hoje.

## Desenvolver

Os tokens moram em [`scripts/build.mjs`](scripts/build.mjs). `actual.css` e
`dist/plus-override.css` são gerados — não edite à mão.

```sh
npm install                    # devDependencies: playwright e subset-font
npx playwright install chromium
node scripts/build.mjs         # gera actual.css e dist/plus-override.css
node scripts/build.mjs --check # falha se os gerados estão velhos
npm run validate               # validador oficial do Actual v26.10.0
npm run validate:master        # compatibilidade com o master
npm test                       # testes estáticos + tipográficos (Chromium)
node scripts/compare-italic.mjs docs/comparacao-italico.png   # refaz a figura acima
```

`validate.mjs` precisa de Node ≥ 22.18. Para outra versão: `ACTUAL_REF=<tag> node scripts/validate.mjs`.
Lint e typecheck: não há (projeto sem TypeScript); `node --check` nos `.mjs`.

Para testar mudanças sem publicar, cole o `dist/plus-override.css` gerado no Actual
como descrito acima.

## Licença

Tema: MIT. Fonte Plus Jakarta Sans (normal e itálico): SIL Open Font License 1.1 ([`fonts/OFL.txt`](fonts/OFL.txt)).
Não é um projeto oficial do Actual Budget.
