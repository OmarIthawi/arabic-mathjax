/*
 * Development server with rebuild-on-change and live reload.
 *
 *   - Serves the repo root on http://localhost:3000, opening testcases/.
 *   - Editing ts/**.ts      → recompile + rebundle + copy assets → full reload.
 *   - Editing css/**.css     → rebuild the stylesheet → CSS is hot-injected.
 *   - Editing testcases/**   → full reload (served directly, no build).
 *
 * browser-sync watches dist/** and testcases/** for the reload; this script
 * watches ts/** and css/** to drive the rebuild that updates dist/.
 */
import browserSync from 'browser-sync';
import { spawn } from 'node:child_process';

const bs = browserSync.create();

/**
 * Runs a set of npm scripts in sequence, non-blocking. Coalesces overlapping
 * triggers: if a build is already running, one more run is queued.
 */
let building = false;
let queued = null;

function runSteps(steps, label) {
  if (building) {
    queued = { steps, label };
    return;
  }
  building = true;
  console.log(`\n[dev] rebuilding (${label})…`);
  const start = process.hrtime.bigint();

  const runNext = (i) => {
    if (i >= steps.length) {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      console.log(`[dev] rebuilt in ${ms.toFixed(0)}ms`);
      building = false;
      if (queued) {
        const next = queued;
        queued = null;
        runSteps(next.steps, next.label);
      }
      return;
    }
    const child = spawn('npm', ['run', steps[i]], { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[dev] step "${steps[i]}" failed (exit ${code}); waiting for next change`);
        building = false;
        queued = null;
        return;
      }
      runNext(i + 1);
    });
  };

  runNext(0);
}

/** Small trailing debounce so a burst of saves triggers one rebuild. */
function debounce(fn, wait = 150) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

bs.init(
  {
    server: { baseDir: '.' },
    startPath: 'testcases/',
    port: Number(process.env.PORT) || 3000,
    notify: false,
    ui: false,
    open: false,
    files: ['dist/**/*', 'testcases/**/*.{html,css,js,yml}'],
  },
  () => {
    bs.watch(
      'ts/**/*.ts',
      { ignoreInitial: true },
      debounce(() => runSteps(['build:ts', 'build:component', 'build:assets'], 'ts'))
    );
    bs.watch(
      'css/**/*.css',
      { ignoreInitial: true },
      debounce(() => runSteps(['build:assets'], 'css'))
    );
    console.log('[dev] watching ts/ and css/ for changes; testcases/ reload directly');
  }
);
