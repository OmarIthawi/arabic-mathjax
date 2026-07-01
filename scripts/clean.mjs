/*
 * Removes build outputs (compiled JS, the webpacked bundle and dist artifacts).
 */
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const target of [
  'js',
  'dist/arabic.min.js',
  'dist/arabic.css',
  'components/arabic/arabic.min.js',
]) {
  rmSync(resolve(root, target), { recursive: true, force: true });
}
console.log('clean: removed build outputs');
