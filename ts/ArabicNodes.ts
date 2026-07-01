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
 * @file The heart of the Arabic extension. `createArabicToken` is a
 *       `NODES.token` factory override: when the parser environment language is
 *       Arabic it substitutes Arabic glyphs into `mi`/`mn`/`mo` tokens and marks
 *       each one to be mirrored. `flipNode` toggles the mirror on any node (used
 *       for the `\ar`/`\alwaysar`/`\fliph` container flips).
 *
 *       Marking is done by setting CSS classes directly on the MmlNode (the same
 *       technique the built-in `\class{}{}` macro uses, which is known to reach
 *       the output DOM). The shipped `arabic.css` turns `.mfliph` into a
 *       `transform: scaleX(-1)` mirror, so no output-jax override is needed.
 *
 *       Modeled on MathJax's own `boldsymbol` package (`createBoldToken`).
 */

import { MmlNode } from '@mathjax/src/js/core/MmlTree/MmlNode.js';
import { NodeFactory } from '@mathjax/src/js/input/tex/NodeFactory.js';
import ParseOptions from '@mathjax/src/js/input/tex/ParseOptions.js';
import { addClass, removeClass, hasClass } from './ArabicUtil.js';
import { mapNumbers, mapIdentifiers, mapOperators } from './ArabicUtil.js';

/** CSS class that mirrors a node horizontally (`transform: scaleX(-1)`). */
export const FLIP_CLASS = 'mfliph';
/** CSS class that selects the Arabic font and upright style. */
export const FONT_CLASS = 'mar';
/** CSS class that lays out text right-to-left (`direction: rtl`). */
export const RTL_CLASS = 'mrtl';

/** Any character in the Arabic Unicode block (letters, digits, punctuation). */
const ARABIC_CHAR = /[؀-ۿ]/;
/**
 * Arabic letters only — excludes the Arabic-Indic digits (U+0660–U+0669) and
 * number punctuation like the decimal separator (U+066B), so that number text
 * (from `\transn`) is not treated as right-to-left running text.
 */
const ARABIC_LETTER = /[ء-ٟٮ-ۿ]/;

/**
 * Toggles the horizontal-flip class on a node. Toggling gives "flip twice means
 * no flip" semantics: an Arabized token flips once at creation, and when it is
 * the sole argument of `\ar`/`\alwaysar`/`\fliph` the container flips it back —
 * leaving a lone glyph upright.
 *
 * @param {MmlNode} node The node to (un)mirror.
 */
export function flipNode(node: MmlNode): void {
  if (hasClass(node, FLIP_CLASS)) {
    removeClass(node, FLIP_CLASS);
  } else {
    addClass(node, FLIP_CLASS);
  }
}

/**
 * `NODES.token` override. When the parser environment language is Arabic it
 * substitutes Arabic glyphs into `mi`/`mn`/`mo` tokens and mirrors them, and it
 * gives explicit Arabic `\text{}` the Arabic font (plus right-to-left flow for
 * word text). Everything else is created unchanged.
 *
 * `mi`/`mn` are always mirrored (so each glyph reads correctly inside a mirrored
 * RTL expression); `mo` is mirrored only when an operator was actually
 * substituted.
 *
 * @param {NodeFactory} factory The current node factory.
 * @param {string} kind The token kind (`mi`, `mn`, `mo`, `mtext`, ...).
 * @param {any} def Node properties.
 * @param {string} text The token's text content.
 * @returns {MmlNode} The (possibly Arabized) token node.
 */
export function createArabicToken(
  factory: NodeFactory,
  kind: string,
  def: any,
  text: string
): MmlNode {
  const isArabic = factory.configuration.parser.stack.env['lang'] === 'ar';

  if (!isArabic || (kind !== 'mi' && kind !== 'mn' && kind !== 'mo')) {
    return NodeFactory.createToken(factory, kind, def, text);
  }

  let mapped = text;
  if (kind === 'mn') {
    mapped = mapNumbers(text);
  } else if (kind === 'mi') {
    mapped = mapIdentifiers(text);
  } else {
    mapped = mapOperators(text);
  }

  const changed = mapped !== text;
  const token = NodeFactory.createToken(factory, kind, def, mapped);

  if (kind !== 'mo' || changed) {
    flipNode(token);
    if (changed) {
      addClass(token, FONT_CLASS);
    }
  }

  return token;
}

/**
 * Walks a subtree and marks Arabic token nodes for direction (and, for `\text{}`,
 * for font). Running Arabic that spans more than one glyph — multi-letter
 * function names (`\cos` → `جتا`), the limit operator (`\lim` → `نهــا`), and
 * word text (from `\transt` etc.) — must flow right-to-left so its glyphs read in
 * the correct order. Number text (digits only, from `\transn`) and single-letter
 * identifiers are left in their natural order. `\text{}` builds its `mtext`
 * outside the token factory, so its font is applied here too.
 *
 * @param {MmlNode} node The subtree root to walk.
 */
function markArabicText(node: MmlNode): void {
  if (!node) {
    return;
  }
  if (node.isKind('mtext') || node.isKind('mi') || node.isKind('mo')) {
    const text = (node as unknown as { getText(): string }).getText();
    if (node.isKind('mtext') && ARABIC_CHAR.test(text)) {
      addClass(node, FONT_CLASS);
    }
    if (ARABIC_LETTER.test(text)) {
      addClass(node, RTL_CLASS);
    }
    return;
  }
  for (const child of node.childNodes || []) {
    markArabicText(child as MmlNode);
  }
}

/**
 * `POSTPROCESSORS` pass: marks Arabic text nodes for font and direction once the
 * whole tree is built.
 *
 * @param {{ data: ParseOptions }} arg The post-processing argument.
 * @param {ParseOptions} arg.data The parse options carrying the tree root.
 */
export function markArabicTextNodes(arg: { data: ParseOptions }): void {
  markArabicText(arg.data.root);
}
