globalThis.document = { documentElement: { lang: 'ar' } };
import { mathjax } from '@mathjax/src/js/mathjax.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { liteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import { SerializedMmlVisitor } from '@mathjax/src/js/core/MmlTree/SerializedMmlVisitor.js';
import { STATE } from '@mathjax/src/js/core/MathItem.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import '../js/arabic.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({ packages: ['base', 'ams', 'arabic'] });
const html = mathjax.document('', { InputJax: tex });
const visitor = new SerializedMmlVisitor();
const dec = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

for (const t of [
  '\\ar{\\transt{\\text{rational}}{رقم منطقي} = \\frac{\\transt{\\text{i}}{عدد صحيح}}{\\transt{\\text{i}}{عدد صحيح}}}',
  '\\ar{x + \\transn{1,000.5}}',
  '\\ar{\\transt{\\text{x}}{مرحبا}}',
]) {
  const node = html.convert(t, { display: true, end: STATE.CONVERT });
  console.log('TeX:', t);
  console.log(dec(visitor.visitTree(node)).replace(/\n\s*/g, ' '));
  console.log('---');
}
