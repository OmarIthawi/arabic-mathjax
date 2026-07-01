/*
 *  Webpack entry point for the Arabic extension component. It pulls in the
 *  compiled extension (which registers the `arabic` TeX package). The MathJax
 *  build tool (`makeAll`) bundles this into `arabic.min.js`.
 */
import '../../js/arabic.js';
