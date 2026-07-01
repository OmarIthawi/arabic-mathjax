/*
 * Functional verification: runs MathJax v4 in Node with the Arabic package
 * registered, converts TeX to MathML, and asserts the Arabization (glyph
 * substitution) and the flip/font class marking. This exercises the real parse
 * pipeline (CommandMap macros and the NODES.token override) without a browser.
 *
 * MathML serialization emits non-ASCII as &#xNNN; entities and orders
 * attributes as (data-latex, class, ...), so assertions decode entities first
 * and match on order-independent substrings.
 */

// Pretend we are on an Arabic page so `\ar` Arabizes (mirrors <html lang="ar">).
globalThis.document = { documentElement: { lang: 'ar' } };

import { mathjax } from '@mathjax/src/js/mathjax.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { liteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import { SerializedMmlVisitor } from '@mathjax/src/js/core/MmlTree/SerializedMmlVisitor.js';
import { STATE } from '@mathjax/src/js/core/MathItem.js';

// Registers Configuration.create('arabic', ...) into the shared handler.
import '../js/arabic.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({ packages: ['base', 'arabic'] });
const html = mathjax.document('', { InputJax: tex });
const visitor = new SerializedMmlVisitor();

/** Decodes &#xNNN; / &#NNN; entities so we can match on real glyphs. */
function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

/** Converts a TeX string to serialized MathML (after TeX post-processing). */
function tex2mml(s) {
  const node = html.convert(s, { display: true, end: STATE.CONVERT });
  return decode(visitor.visitTree(node)).replace(/\n\s*/g, ' ');
}

let passed = 0;
let failed = 0;

function check(title, tex, expect = [], forbid = []) {
  let mml;
  try {
    mml = tex2mml(tex);
  } catch (e) {
    console.log(`✗ ${title}\n    ERROR: ${e.message}`);
    failed++;
    return;
  }
  const missing = expect.filter((s) => !mml.includes(s));
  const present = forbid.filter((s) => mml.includes(s));
  if (missing.length === 0 && present.length === 0) {
    console.log(`✓ ${title}`);
    passed++;
  } else {
    console.log(`✗ ${title}\n    TeX: ${tex}`);
    if (missing.length) console.log(`    missing: ${JSON.stringify(missing)}`);
    if (present.length) console.log(`    forbidden: ${JSON.stringify(present)}`);
    console.log(`    MathML: ${mml}`);
    failed++;
  }
}

// === Glyph substitution ================================================

// Single identifier: mapped to Arabic, font class set, but a lone glyph is left
// upright (token flip cancelled by the container flip) — matches v2.
check('\\ar{x}: x → س, font class, not mirrored', '\\ar{x}',
  ['<mi class="mar" data-latex="\\ar{x}">س</mi>'], ['mfliph']);

// Single number: digits mapped, upright (numbers are not mirrored).
check('\\ar{123}: 123 → ١٢٣, upright', '\\ar{123}',
  ['١٢٣', 'class="mar"'], ['mfliph']);

// Function name (multi-letter identifier) maps.
check('\\alwaysar{\\sin}: sin → جا', '\\alwaysar{\\sin x}', ['جا']);

// === Operators =========================================================

// Comma maps to Arabic comma and is mirrored (inside a multi-element flip).
check('\\ar{a,b}: comma → ،, container mirrored', '\\ar{a,b}',
  ['أ', '،', 'ب', 'class="mfliph"', 'class="mfliph mar"']);

// Equals does NOT map and is NOT mirrored (mo flips only when substituted).
check('\\ar{x=y}: = untouched', '\\ar{x=y}',
  ['<mo data-latex="=">=</mo>', 'س', 'ص']);

// === Container flip (multi-element) ====================================

check('\\ar{x=\\frac{1}{2}}: mirrored fraction', '\\ar{x=\\frac{1}{2}}',
  ['class="mfliph"', 'س', '١', '٢']);

check('canonical fraction #2 \\ar{x=\\frac{1+y}{1+2z^2}}',
  '\\ar{x=\\frac{1+y}{1+2z^2}}',
  ['س', 'ص', 'ع', '١', '٢', 'class="mfliph"']);

// === \fliph ============================================================

// Standalone flip mirrors its argument (text left as-is).
check('\\fliph{\\text{abc}}: mirrored text', '\\fliph{\\text{abc}}',
  ['class="mfliph"', '>abc</mtext>']);

// === \transn ===========================================================

// In a multi-element Arabic context, the number is rendered as flipped text so
// it reads left-to-right inside the mirrored expression, with the ٫ separator.
check('\\ar{x+\\transn{1,000.5}}: digits + ٫ separator, flipped text',
  '\\ar{x+\\transn{1,000.5}}',
  ['١٠٠٠٫٥', 'class="mfliph"']);

// === \transt / dictionary macros =======================================

check('\\ar{y+\\transt{\\text{or}}{أو}}: Arabic text branch',
  '\\ar{y+\\transt{\\text{or}}{أو}}', ['أو']);

check('\\ar{x+\\zero}: dict macro \\zero → صفر', '\\ar{x+\\zero}', ['صفر']);

check('\\ar{x+\\radius}: dict macro \\radius → نق', '\\ar{x+\\radius}', ['نق']);

// === \tmfrac ===========================================================

check('\\ar{\\tmfrac{2}{1}{2}}: mixed fraction has an mfrac',
  '\\ar{\\tmfrac{2}{1}{2}}', ['mfrac', '١', '٢']);

// === Sanity: extension is inert without \ar / \alwaysar ================

check('plain math untouched (no \\ar)', 'x=\\frac{1}{2}',
  ['<mi data-latex="x">x</mi>', '<mn data-latex="1">1</mn>'],
  ['mfliph', 'mar', 'س']);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
