/*
 * Post-build asset step (replaces the old gulp pipeline):
 *   1. Copies the webpacked component bundle to dist/arabic.min.js.
 *   2. Copies and lightly minifies css/arabic.css to dist/arabic.css.
 * Dependency-free and cross-platform.
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
mkdirSync(dist, { recursive: true });

// 1. Component bundle (built by makeAll into the component dir with dist: ".").
const bundle = resolve(root, 'components/arabic/arabic.min.js');
if (!existsSync(bundle)) {
  console.error(`build-assets: missing ${bundle} — run "npm run build:component" first.`);
  process.exit(1);
}
copyFileSync(bundle, resolve(dist, 'arabic.min.js'));

// 2. Stylesheet.
const css = readFileSync(resolve(root, 'css/arabic.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '') // strip comments
  .replace(/\s*([{}:;,])\s*/g, '$1') // collapse space around punctuation
  .replace(/;}/g, '}') // drop trailing semicolons
  .replace(/\s+/g, ' ') // collapse remaining whitespace
  .trim();
writeFileSync(resolve(dist, 'arabic.css'), css + '\n');

console.log('build-assets: wrote dist/arabic.min.js and dist/arabic.css');
