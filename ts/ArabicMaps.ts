/*************************************************************
 *
 *  The MIT License
 *
 *  Copyright (c) 2015-2026 Edraak.org, Omar Al-Ithawi and contributors.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 */

/**
 * @file The Arabic configuration data: the Latin -> Arabic substitution maps,
 *       the macro dictionary and the page-language helper. Ported verbatim from
 *       the MathJax v2 `MathJax.Extension.Arabic.config` object.
 */

/**
 * Maps Latin identifiers (variable, function and trigonometric names) to their
 * Arabic equivalents. Matching is case-insensitive and longest-key-first.
 */
export const identifiersMap: { [key: string]: string } = {
  // Variable names
  a: 'أ',
  b: 'ب', // TODO: Consider using Arabic letter dotless beh 0x66e instead
  c: 'جـ', // Suffixed with Unicode Arabic Tatweel 0x0640
  x: 'س',
  y: 'ص',
  z: 'ع',
  n: 'ن',

  // Function names
  f: 'ق', // TODO: Consider using dotless qaf (ٯ) instead
  g: 'جـ', // With Unicode Arabic Tatweel 0x0640
  h: 'هـ', // With Unicode Arabic Tatweel 0x0640

  // Mixed use
  k: 'ك',
  r: 'ر',
  t: 'ت',
  d: 'د', // Function, variable and (dx)
  e: 'هـ', // With Unicode Arabic Tatweel 0x0640
  m: 'م',
  l: 'ل',

  // Math functions
  sin: 'جا',
  cos: 'جتا',
  tan: 'ظا',
  cot: 'ظتا',
  sec: 'قا',
  csc: 'قتا',
  log: 'لو',
};

/**
 * Maps Western (Arabic) digits to Eastern Arabic-Indic numerals.
 */
export const numbersMap: { [key: string]: string } = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

/**
 * Maps Latin punctuation/operators to their Arabic equivalents.
 */
export const operatorsMap: { [key: string]: string } = {
  // English to Arabic punctuations
  ',': '،',
  ';': '؛',
  // Limits
  lim: 'نهــا',
};

/**
 * The macro dictionary. Each entry is `[texCommand, helper, params]` where
 * `helper` is one of `Text`, `TeX` or `Symbols` (see {@link makeDictMethod}).
 */
export const dict: { [key: string]: [string, string, string[]] } = {
  // A macro to force English zero in both languages
  Zero: ['zero', 'Text', ['0', 'صفر']], // Better localized Zero
  Radius: ['radius', 'Text', ['r', 'نق']], // Circle radius
  Area: ['Area', 'Text', ['A', 'م']], // Area of circles and other stuff

  // Used for special charge character in the modified Amiri font:
  //   - https://github.com/OmarIthawi/amiri/releases
  //     This only will work when activating that font.
  Charge: ['charge', 'TeX', ['C', '\\fliph{\\text{ڛ}}']],
};

/** Start of the Arabic Unicode block. */
export const arabicUnicodeStart = 0x600;
/** End of the Arabic Unicode block. */
export const arabicUnicodeEnd = 0x6ff;

/** Matches runs of Arabic characters (used by `\transs`). */
export const arabicLanguageRegExp = /([؀-ۿ]+)/g;

/** Decimal separator used by `\transn`. */
export const arabicDecimalSplitter = '٫';

/**
 * Whether the current page is an Arabic page (drives the `\ar` macro).
 *
 * @returns {boolean} True when `<html lang="ar">`.
 */
export function isArabicPage(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.lang === 'ar'
  );
}
