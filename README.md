# Arabic MathJax Extension

A [MathJax **v4**](https://www.mathjax.org/) extension that renders mathematics in
Arabic notation: Arabic-Indic numerals, Arabic identifiers and function names, Arabic
punctuation, and right-to-left layout of expressions.

It ships as a TeX package (`arabic`) plus a small stylesheet, and is written in
TypeScript.

## Usage on a page

Load MathJax v4, add the Arabic extension as a component, and include its stylesheet:

```html
<link rel="stylesheet" href="https://your-host/arabic-mathjax/dist/arabic.css">
<script>
  window.MathJax = {
    loader: {
      load: ['[arabic]/arabic.min.js'],
      paths: { arabic: 'https://your-host/arabic-mathjax/dist' }
    },
    tex: {
      packages: { '[+]': ['arabic'] }
    }
  };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js"></script>
```

Then wrap math in `\ar{…}` to Arabize it when the page is Arabic
(`<html lang="ar">`), or `\alwaysar{…}` to Arabize unconditionally:

```html
<p lang="ar">\[ \ar{ x = \frac{1 + y}{1 + 2z^2} } \]</p>
```

> The extension targets the **CommonHTML** output. Arabic glyphs are rendered with
> the [Amiri](https://github.com/alif-type/amiri) font by default; make Amiri
> available on your page, or override the `mjx-container .mar` font stack in your CSS.

## Macros

| Macro | Description |
| --- | --- |
| `\ar{…}` | Arabize the argument when the page language is Arabic. |
| `\alwaysar{…}` | Always Arabize and mirror the argument. |
| `\fliph{…}` | Mirror a sub-expression horizontally (RTL). |
| `\transn{…}` | Translate Western digits to Arabic-Indic numerals (with the Arabic decimal separator). |
| `\tmfrac{int}{num}{den}` | A mixed fraction, laid out right-to-left when Arabic. |
| `\transx{en}{ar}` | Pick the English or Arabic TeX form by language. |
| `\transt{en}{ar}` | Like `\transx`, with the Arabic wrapped in `\text{}`. |
| `\transs{en}{ar}` | Like `\transx`, wrapping Arabic runs in `\text{}`. |
| `\zero \radius \Area \charge` | Localized dictionary symbols. |

## Development

Requires Node.js. No Docker.

```bash
npm install      # install dependencies
npm run build    # compile TS -> js/, webpack -> dist/arabic.min.js, build dist/arabic.css
npm run dev      # build, then serve testcases/ on http://localhost:3000 with live reload
npm test         # build, then run the MathML render checks (test/render.mjs)
npm run clean    # remove build outputs
```

### Layout

- `ts/` — TypeScript source (compiled to `js/`).
  - `ArabicConfiguration.ts` — registers the `arabic` TeX package.
  - `ArabicMethods.ts` — the macro parse methods.
  - `ArabicNodes.ts` — token Arabization + the horizontal-flip marker.
  - `ArabicMaps.ts` — the substitution maps and dictionary.
  - `ArabicUtil.ts` — glyph mapping and CSS-class helpers.
- `css/arabic.css` — the `.mfliph` mirror and `.mar` Arabic-font rules.
- `components/arabic/` — the MathJax component build config.
- `dist/` — the built `arabic.min.js` component and `arabic.css`.
- `testcases/` — a live test page driven by `testcases.yml`.
- `test/render.mjs` — headless tex→MathML checks.

## License

[MIT](LICENSE).
