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
 *       `NODES.token` factory override (the v4 replacement for v2's
 *       `TEX.Parse.prototype.mmlToken`): when the parser environment language is
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
import { addClass, removeClass, hasClass } from './ArabicUtil.js';
import { mapNumbers, mapIdentifiers, mapOperators } from './ArabicUtil.js';

/** CSS class that mirrors a node horizontally (`transform: scaleX(-1)`). */
export const FLIP_CLASS = 'mfliph';
/** CSS class that selects the Arabic font and upright style. */
export const FONT_CLASS = 'mar';

/**
 * Toggles the horizontal-flip class on a node. Toggling preserves the v2 "flip
 * twice means no flip" semantics: an Arabized token flips once at creation, and
 * when it is the sole argument of `\ar`/`\alwaysar`/`\fliph` the container flips
 * it back — leaving a lone glyph upright, exactly as in v2.
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
 * `NODES.token` override. Creates a token node, and — when the parser
 * environment language is Arabic — substitutes Arabic glyphs into `mi`/`mn`/`mo`
 * tokens and mirrors them. Other token kinds (notably `mtext`, whose content is
 * already explicit Arabic from `\text{}`) are left untouched.
 *
 * `mi`/`mn` are always mirrored (so each glyph reads correctly inside a mirrored
 * RTL expression); `mo` is mirrored only when an operator was actually
 * substituted — matching the v2 arabicNumber/arabicIdentifier/arabicOperator
 * behavior.
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
