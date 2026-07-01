/*
 * Builds the equations table from testcases.yml + equations.html (a Mustache
 * template) and typesets it with MathJax. Each case is shown twice: the plain
 * (English) equation and the same equation wrapped in \ar{...}.
 */
async function renderEquations() {
  const [yamlText, template] = await Promise.all([
    fetch('testcases.yml').then((r) => r.text()),
    fetch('equations.html').then((r) => r.text()),
  ]);

  const testCases = jsyaml.load(yamlText);
  document.getElementById('equations').innerHTML = Mustache.render(template, {
    equations: testCases.equations.slice().reverse(),
  });

  const dynAr = document.getElementById('dynamic-ar');
  const dynEn = document.getElementById('dynamic-en');

  const renderDynamic = () => {
    const equation = document.getElementById('dynamic-equation').value;
    dynEn.innerHTML = '\\[' + equation + '\\]';
    dynAr.innerHTML = '\\[\\ar{' + equation + '}\\]';
    MathJax.typesetClear([dynEn, dynAr]);
    MathJax.typesetPromise([dynEn, dynAr]);
  };

  document
    .getElementById('dynamic-equation')
    .addEventListener('change', renderDynamic);
  document
    .getElementById('show-dynamic-equation')
    .addEventListener('click', renderDynamic);

  await MathJax.startup.promise;
  await MathJax.typesetPromise([document.getElementById('equations')]);
  renderDynamic();
}
