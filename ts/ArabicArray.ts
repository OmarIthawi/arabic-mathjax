/*************************************************************
 *
 *  The MIT License
 *
 *  Copyright (c) 2015-2026 Edraak.org, Omar Al-Ithawi and contributors.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction.
 */

/**
 * @file Makes the environment language (`lang`) propagate into array/alignment
 *       environments (`array`, `align`, `cases`, matrices, ...). Array stack
 *       items deliberately do not inherit the surrounding environment
 *       (`copyEnv` is false) and clear it after every cell, which would drop the
 *       `lang` flag set by `\ar`/`\alwaysar` — leaving the cell contents
 *       un-Arabized. This patches `ArrayItem` (the base of every alignment item)
 *       to inherit the environment and to keep `lang` across `clearEnv`.
 */

import { ArrayItem } from '@mathjax/src/js/input/tex/base/BaseItems.js';

const PATCHED = 'arabicLangPatched';

/**
 * Patches the shared `ArrayItem` prototype so alignment cells keep the `lang`
 * flag. Idempotent — safe to call for every parser configuration.
 */
export function patchArrayLang(): void {
  const proto = ArrayItem.prototype as any;
  if (proto[PATCHED]) {
    return;
  }
  proto[PATCHED] = true;

  // Inherit the surrounding environment (so `lang` reaches the cells).
  Object.defineProperty(proto, 'copyEnv', {
    get() {
      return true;
    },
    configurable: true,
  });

  // Keep `lang` when the per-cell environment is cleared.
  const clearEnv = proto.clearEnv;
  proto.clearEnv = function () {
    const lang = this.env['lang'];
    clearEnv.call(this);
    if (lang) {
      this.env['lang'] = lang;
    }
  };
}
