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
 * @file Wires the Arabic TeX package together: registers the macro maps, the
 *       token-factory override and the post-processor, and creates the named
 *       `arabic` Configuration (so it can be added via `tex: {packages: ['arabic']}`).
 */

import {
  HandlerType,
  ConfigurationType,
} from '@mathjax/src/js/input/tex/HandlerTypes.js';
import { Configuration } from '@mathjax/src/js/input/tex/Configuration.js';
import { CommandMap } from '@mathjax/src/js/input/tex/TokenMap.js';
import { createArabicToken, markArabicTextNodes } from './ArabicNodes.js';
import { ArabicMethods, ArabicDictMethods } from './ArabicMethods.js';
import { patchArrayLang } from './ArabicArray.js';

new CommandMap('arabicMacros', {
  ar: ArabicMethods.HandleArabic,
  alwaysar: ArabicMethods.MarkAsArabic,
  fliph: ArabicMethods.HandleFlipHorizontal,
  transn: ArabicMethods.TranslateNumbers,
  tmfrac: ArabicMethods.TranslateMixedFraction,
  transx: ArabicMethods.TranslateTeX,
  transt: ArabicMethods.TranslateText,
  transs: ArabicMethods.TranslateSymbols,
});

new CommandMap('arabicDict', ArabicDictMethods);

export const ArabicConfiguration = Configuration.create('arabic', {
  [ConfigurationType.HANDLER]: {
    [HandlerType.MACRO]: ['arabicMacros', 'arabicDict'],
  },
  [ConfigurationType.NODES]: { token: createArabicToken },
  [ConfigurationType.POSTPROCESSORS]: [markArabicTextNodes],
  [ConfigurationType.INIT]: patchArrayLang,
});
