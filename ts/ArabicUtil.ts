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
 * @file Pure helpers for the Arabic extension: glyph substitution and CSS
 *       class manipulation on MmlNodes. No MathJax parser state is touched here.
 */

import { MmlNode } from '@mathjax/src/js/core/MmlTree/MmlNode.js';
import NodeUtil from '@mathjax/src/js/input/tex/NodeUtil.js';
import {
  identifiersMap,
  numbersMap,
  operatorsMap,
  arabicLanguageRegExp,
} from './ArabicMaps.js';

/**
 * Escapes a string for safe inclusion in a regular expression.
 *
 * @param {string} str The raw string.
 * @returns {string} The escaped string.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

/**
 * Builds a case-insensitive, longest-match-first regular expression from a map's
 * keys (so e.g. `sin` is matched before `s`).
 *
 * @param {object} map The substitution map.
 * @returns {RegExp} The compiled regular expression.
 */
export function getKeysRegExp(map: { [key: string]: string }): RegExp {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  return new RegExp(keys.map(escapeRegExp).join('|'), 'gi');
}

const identifiersKeysRegExp = getKeysRegExp(identifiersMap);
const operatorsKeysRegExp = getKeysRegExp(operatorsMap);

/**
 * Replaces Western digits in a string with Arabic-Indic numerals.
 *
 * @param {string} text The text to map.
 * @returns {string} The mapped text.
 */
export function mapNumbers(text: string): string {
  return text.replace(/[0-9]/g, (m) => numbersMap[m]);
}

/**
 * Replaces Latin identifiers (case-insensitively) with their Arabic glyphs.
 *
 * @param {string} text The text to map.
 * @returns {string} The mapped text.
 */
export function mapIdentifiers(text: string): string {
  return text.replace(
    identifiersKeysRegExp,
    (m) => identifiersMap[m.toLowerCase()]
  );
}

/**
 * Replaces Latin operators/punctuation with their Arabic equivalents.
 *
 * @param {string} text The text to map.
 * @returns {string} The mapped text.
 */
export function mapOperators(text: string): string {
  return text.replace(operatorsKeysRegExp, (m) => operatorsMap[m]);
}

/**
 * Wraps each run of Arabic characters in `\fliph{\text{...}}` (used by `\transs`).
 *
 * @param {string} text The mixed Latin/Arabic source.
 * @returns {string} TeX with Arabic runs wrapped.
 */
export function wrapArabicRuns(text: string): string {
  return text.replace(arabicLanguageRegExp, '\\fliph{\\text{$1}}');
}

/**
 * Returns a node's CSS classes as an array.
 *
 * @param {MmlNode} node The node.
 * @returns {string[]} The class names.
 */
function getClasses(node: MmlNode): string[] {
  const current = (NodeUtil.getAttribute(node, 'class') as string) || '';
  return current.split(/\s+/).filter(Boolean);
}

/**
 * Whether a node carries a given CSS class.
 *
 * @param {MmlNode} node The node.
 * @param {string} cls The class name.
 * @returns {boolean} True if present.
 */
export function hasClass(node: MmlNode, cls: string): boolean {
  return getClasses(node).includes(cls);
}

/**
 * Adds a CSS class to an MmlNode, merging with any existing `class` attribute
 * and avoiding duplicates.
 *
 * @param {MmlNode} node The node to mark.
 * @param {string} cls The class name to add.
 */
export function addClass(node: MmlNode, cls: string): void {
  const classes = getClasses(node);
  if (!classes.includes(cls)) {
    classes.push(cls);
    NodeUtil.setAttribute(node, 'class', classes.join(' '));
  }
}

/**
 * Removes a CSS class from an MmlNode.
 *
 * @param {MmlNode} node The node to unmark.
 * @param {string} cls The class name to remove.
 */
export function removeClass(node: MmlNode, cls: string): void {
  const classes = getClasses(node).filter((c) => c !== cls);
  if (classes.length) {
    NodeUtil.setAttribute(node, 'class', classes.join(' '));
  } else {
    NodeUtil.removeAttribute(node, 'class');
  }
}
