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
 * @file The TeX parse methods for the Arabic macros: `\ar`, `\alwaysar`,
 *       `\fliph`, `\transn`, `\tmfrac`, `\transx`, `\transt`, `\transs`, and the
 *       dictionary macros (`\zero`, `\radius`, `\Area`, `\charge`). Ported from
 *       the v2 `MathJax.Extension.Arabic` helpers and `TEX.Parse` augmentations.
 */

import { MmlNode } from '@mathjax/src/js/core/MmlTree/MmlNode.js';
import NodeUtil from '@mathjax/src/js/input/tex/NodeUtil.js';
import TexParser from '@mathjax/src/js/input/tex/TexParser.js';
import { ParseMethod } from '@mathjax/src/js/input/tex/Types.js';
import { flipNode } from './ArabicNodes.js';
import {
  dict,
  arabicDecimalSplitter,
  isArabicPage,
} from './ArabicMaps.js';
import { mapNumbers, wrapArabicRuns } from './ArabicUtil.js';

/**
 * Whether the current parse environment is Arabic. Set transiently by
 * `\ar`/`\alwaysar` and inherited by nested parses.
 *
 * @param {TexParser} parser The current parser.
 * @returns {boolean} True when the environment language is Arabic.
 */
function inArabic(parser: TexParser): boolean {
  return parser.stack.env['lang'] === 'ar';
}

/**
 * Parses an arbitrary TeX string into a single MmlNode, inheriting the current
 * environment (so the Arabic `lang` flag, packages, etc. all apply). This is the
 * v4 equivalent of v2's `MathJax.InputJax.TeX.Parse(tex).mml()`.
 *
 * @param {TexParser} parser The current parser.
 * @param {string} tex The TeX source to parse.
 * @returns {MmlNode} The parsed node.
 */
function parseString(parser: TexParser, tex: string): MmlNode {
  return new TexParser(tex, parser.stack.env, parser.configuration).mml();
}

/**
 * Parses the macro's brace argument and returns it as a single node. A
 * single-element argument is returned unwrapped (so a container flip toggles
 * that same element — the v2 `_getArgumentMML` behavior that leaves a lone glyph
 * upright); a multi-element argument is wrapped in a concrete mrow so the flip
 * class attaches to a rendered element (as in the v4 `html` package).
 *
 * @param {TexParser} parser The current parser.
 * @param {string} name The macro name.
 * @returns {MmlNode} The argument as a single node.
 */
function getArgumentMML(parser: TexParser, name: string): MmlNode {
  const arg = parser.ParseArg(name);
  if (!NodeUtil.isInferred(arg)) {
    return arg;
  }
  const children = NodeUtil.getChildren(arg);
  if (children.length === 1) {
    return children[0] as MmlNode;
  }
  const mrow = parser.create('node', 'mrow');
  NodeUtil.copyChildren(arg, mrow);
  NodeUtil.copyAttributes(arg, mrow);
  return mrow;
}

/**
 * Parses an argument with the environment language forced to Arabic, then
 * horizontally flips the result. Shared by `\ar` (on Arabic pages) and
 * `\alwaysar`.
 *
 * @param {TexParser} parser The current parser.
 * @param {string} name The macro name.
 * @returns {MmlNode} The Arabized, flipped node.
 */
function parseAsArabic(parser: TexParser, name: string): MmlNode {
  const prev = parser.stack.env['lang'];
  parser.stack.env['lang'] = 'ar';
  const arg = getArgumentMML(parser, name);
  parser.stack.env['lang'] = prev;
  flipNode(arg);
  return arg;
}

/**
 * Builds a parse method that pushes the English or the Arabic TeX form depending
 * on the current environment language. The v4 equivalent of v2's `Arabic.TeX`.
 *
 * @param {string} english The English TeX source.
 * @param {string} arabic The Arabic TeX source.
 * @returns {ParseMethod} The parse method.
 */
function makeTeXMethod(english: string, arabic: string): ParseMethod {
  return (parser: TexParser, _name: string) => {
    parser.Push(parseString(parser, inArabic(parser) ? arabic : english));
  };
}

/**
 * Builds a parse method from a dictionary entry (`Text`, `TeX` or `Symbols`).
 *
 * @param {string} helper The helper kind from the dictionary.
 * @param {string} english The English TeX source.
 * @param {string} arabic The Arabic source (plain text or symbols).
 * @returns {ParseMethod} The parse method.
 */
function makeDictMethod(
  helper: string,
  english: string,
  arabic: string
): ParseMethod {
  if (helper === 'Text') {
    return makeTeXMethod(english, `\\fliph{\\text{${arabic}}}`);
  }
  if (helper === 'Symbols') {
    return makeTeXMethod(english, wrapArabicRuns(arabic));
  }
  return makeTeXMethod(english, arabic);
}

export const ArabicMethods: { [key: string]: ParseMethod } = {
  /**
   * `\ar{...}` — Arabize the argument when the page language is Arabic,
   * otherwise render it unchanged (English).
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  HandleArabic(parser: TexParser, name: string) {
    if (isArabicPage()) {
      parser.Push(parseAsArabic(parser, name));
    } else {
      parser.Push(getArgumentMML(parser, name));
    }
  },

  /**
   * `\alwaysar{...}` — always Arabize and flip the argument.
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  MarkAsArabic(parser: TexParser, name: string) {
    parser.Push(parseAsArabic(parser, name));
  },

  /**
   * `\fliph{...}` — horizontally mirror the argument (RTL).
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  HandleFlipHorizontal(parser: TexParser, name: string) {
    const arg = getArgumentMML(parser, name);
    flipNode(arg);
    parser.Push(arg);
  },

  /**
   * `\transn{...}` — translate Western digits to Arabic-Indic numerals (with the
   * Arabic decimal separator), rendered as flipped text when Arabic.
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  TranslateNumbers(parser: TexParser, name: string) {
    const english = parser.GetArgument(name);
    const arabicNumbers = mapNumbers(english)
      .replace(/,/g, '')
      .replace(/\./g, arabicDecimalSplitter);
    parser.Push(
      parseString(
        parser,
        inArabic(parser) ? `\\fliph{\\text{${arabicNumbers}}}` : english
      )
    );
  },

  /**
   * `\transx{en}{ar}` — choose the English or Arabic TeX form by language.
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  TranslateTeX(parser: TexParser, name: string) {
    const english = parser.GetArgument(name);
    const arabic = parser.GetArgument(name);
    makeTeXMethod(english, arabic)(parser, name);
  },

  /**
   * `\transt{en}{ar}` — like `\transx` but wraps the Arabic in `\text{}`.
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  TranslateText(parser: TexParser, name: string) {
    const english = parser.GetArgument(name);
    const arabic = parser.GetArgument(name);
    makeDictMethod('Text', english, arabic)(parser, name);
  },

  /**
   * `\transs{en}{ar}` — like `\transx` but wraps Arabic runs in `\text{}`.
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  TranslateSymbols(parser: TexParser, name: string) {
    const english = parser.GetArgument(name);
    const arabic = parser.GetArgument(name);
    makeDictMethod('Symbols', english, arabic)(parser, name);
  },

  /**
   * `\tmfrac{int}{num}{den}` — a mixed fraction, laid out RTL when Arabic.
   *
   * @param {TexParser} parser The current parser.
   * @param {string} name The macro name.
   */
  TranslateMixedFraction(parser: TexParser, name: string) {
    const integer = parser.GetArgument(name);
    const numerator = parser.GetArgument(name);
    const denominator = parser.GetArgument(name);
    const english = `${integer}\\frac{${numerator}}{${denominator}}`;
    const arabic =
      `\\alwaysar{\\fliph{\\frac{${numerator}}{${denominator}}${integer}}}`;
    parser.Push(parseString(parser, inArabic(parser) ? arabic : english));
  },
};

/**
 * The parse methods for the dictionary macros (`\zero`, `\radius`, ...), keyed
 * by their TeX command name. Built from {@link dict}.
 */
export const ArabicDictMethods: { [key: string]: ParseMethod } = (() => {
  const methods: { [key: string]: ParseMethod } = {};
  for (const key of Object.keys(dict)) {
    const [texCommand, helper, params] = dict[key];
    methods[texCommand] = makeDictMethod(helper, params[0], params[1]);
  }
  return methods;
})();
