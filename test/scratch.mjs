globalThis.document = { documentElement: { lang: 'ar' } };
import { mathjax } from '@mathjax/src/js/mathjax.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { liteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import { SerializedMmlVisitor } from '@mathjax/src/js/core/MmlTree/SerializedMmlVisitor.js';
import { STATE } from '@mathjax/src/js/core/MathItem.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import '@mathjax/src/js/input/tex/enclose/EncloseConfiguration.js';
import '../js/arabic.js';
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({ packages: ['base', 'ams', 'enclose', 'arabic'] });
const html = mathjax.document('', { InputJax: tex });
const v = new SerializedMmlVisitor();
const cases = [
  ['A: no small', '\\ar{\\begin{align}a&=1\\\\b&=2\\end{align}}'],
  ['B: small inside first cell', '\\ar{\\begin{align}\\small a&=1\\\\b&=2\\end{align}}'],
  ['C: small group before', '\\ar{{\\small x}\\begin{align}a&=1\\end{align}}'],
  ['D: alignedat/aligned env', '\\ar{\\small\\begin{aligned}a&=1\\\\b&=2\\end{aligned}}'],
];
for (const [label, t] of cases) {
  const n = html.convert(t, { display: true, end: STATE.CONVERT });
  const out = v.visitTree(n).replace(/\n\s*/g,' ');
  const err = out.match(/data-mjx-error="([^"]*)"/);
  console.log(label, '->', err ? 'ERROR: ' + err[1] : 'OK');
}
