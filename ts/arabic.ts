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
 * @file Source entry point for the Arabic MathJax v4 extension. Importing this
 *       registers the `arabic` TeX package (via {@link ArabicConfiguration}).
 *       The companion component entry (`components/arabic/arabic.js`) imports the
 *       compiled version of this file for webpack bundling.
 */

import { VERSION } from '@mathjax/src/js/components/version.js';
import './ArabicConfiguration.js';

declare const MathJax: { loader?: { checkVersion: (...args: any[]) => void } };

if (typeof MathJax !== 'undefined' && MathJax.loader) {
  MathJax.loader.checkVersion('[arabic]/arabic.min.js', VERSION, 'tex-extension');
}
