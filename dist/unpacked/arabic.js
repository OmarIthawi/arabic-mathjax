/*!
 * The MIT License
 *
 * Copyright (c) 2015-2016 Edraak.org, Omar Al-Ithawi and contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function () {
  var mathElements = [
    'mfrac',
    'mi',
    'mn',
    'mo',
    'mroot',
    'mrow',
    'ms',
    'msqrt',
    'mstyle',
    'msubsup',
    'mtext'
  ];

  MathJax.Hub.Register.StartupHook('CommonHTML Jax Ready', function () {
    var CHTML = MathJax.OutputJax.CommonHTML;
    var originalUnkownChar = CHTML.unknownChar;

    CHTML.Augment({
      unknownChar: function () {
        var arabicUnicodeStart = MathJax.Hub.config.Arabic.arabicUnicodeStart;
        var arabicUnicodeEnd = MathJax.Hub.config.Arabic.arabicUnicodeEnd;
        var returnObject = originalUnkownChar.apply(this, arguments);
        var n = returnObject.n;
        var isArabic = (arabicUnicodeStart <= n && n <= arabicUnicodeEnd);

        if (isArabic) {
          returnObject.type = 'char';
        }

        return returnObject;
      },
    });

    MathJax.Hub.Register.StartupHook('Arabic TeX Ready', function () {
      var MML = MathJax.ElementJax.mml;

      var makeElementFlippable = function (name) {
        var originalToHTML = MML[name].prototype.toCommonHTML;

        MML[name].Augment({
          toCommonHTML: function () {
            var element = originalToHTML.apply(this, arguments);

            if (this.arabicFlipH) {
              var flipElement = document.createElement('span');

              flipElement.className = 'mfliph';

              if ('ar' === this.arabicFontLang) {
                flipElement.className += ' mar'; // Keep the leading space
              }

              while (element.firstChild) {
                flipElement.appendChild(element.firstChild);
              }

              element.appendChild(flipElement);
            }

            return element;
          }
        });
      };

      ['mtr', 'mtd'].concat(mathElements).forEach(makeElementFlippable);

      MathJax.Hub.Register.StartupHook('CommonHTML multiline Ready', function () {
        var originalAddLine = MML.mbase.prototype.CHTMLaddLine;

        MML.mbase.Augment({
          CHTMLaddLine: function () {
            var stack = arguments[0];

            // TODO: Would it be possible to use the usual env settings
            //       to fix this issue, instead of doing a querySelector?
            if (stack && stack.querySelector('.mfliph')) {
              stack.className = 'mfliph';
            }

            originalAddLine.apply(this, arguments);
          }
        });

        MathJax.Hub.Startup.signal.Post('Arabic CommonHTML multiline Ready');
      });

      MathJax.Hub.Register.StartupHook('CommonHTML mtable Ready', function () {
        makeElementFlippable('mtable');
        MathJax.Hub.Startup.signal.Post('Arabic CommonHTML mtable Ready');
      });

      MathJax.Hub.Startup.signal.Post('Arabic CommonHTML Ready');
    });
  });

  MathJax.Hub.Register.StartupHook('HTML-CSS Jax Ready', function () {
    MathJax.Hub.Register.StartupHook('Arabic TeX Ready', function () {
      var MML = MathJax.ElementJax.mml;

      var makeElementFlippable = function (name) {
        var originalToHTML = MML[name].prototype.toHTML;

        MML[name].Augment({
          toHTML: function () {
            var element = originalToHTML.apply(this, arguments);
            if (this.arabicFlipH) {
              var flipElement = document.createElement('span');

              flipElement.className = 'mfliph';

              if ('ar' === this.arabicFontLang) {
                flipElement.className += ' mar'; // Keep the leading space
              }

              while (element.firstChild) {
                flipElement.appendChild(element.firstChild);
              }

              element.appendChild(flipElement);
            }

            return element;
          }
        });
      };

      mathElements.forEach(makeElementFlippable);

      MathJax.Hub.Register.StartupHook('HTML-CSS multiline Ready', function () {
        var originalAddLine = MML.mbase.prototype.HTMLaddLine;

        MML.mbase.Augment({
          HTMLaddLine: function () {
            var stack = arguments[0];

            // TODO: Would it be possible to use the usual env settings
            //       to fix this issue, instead of doing a querySelector?
            if (stack && stack.querySelector('.mfliph')) {
              stack.className = 'mfliph';
            }

            originalAddLine.apply(this, arguments);
          }
        });

        MathJax.Hub.Startup.signal.Post('Arabic HTML-CSS multiline Ready');
      });

      MathJax.Hub.Register.StartupHook('HTML-CSS mtable Ready', function () {
        makeElementFlippable('mtable');
        MathJax.Hub.Startup.signal.Post('Arabic HTML-CSS mtable Ready');
      });

      MathJax.Hub.Startup.signal.Post('Arabic HTML-CSS Ready');
    });
  });
}());

MathJax.Extension.Arabic = {
  version: '2.0.0',
  config: MathJax.Hub.CombineConfig("Arabic", {
    dict: {
      // A macros to force English zero in both languages
      'Zero': ['zero', 'Text', ['0', '\u0635\u0641\u0631']],  // Better localized Zero
      'Radius': ['radius', 'Text', ['r', '\u0646\u0642']],  // Circle radius
      'Area': ['Area', 'Text', ['A', '\u0645']],  // Area of circles and other stuff

      // Used for special charge character in the modified Amiri font:
      //   - https://github.com/OmarIthawi/amiri/releases
      //     This only will work when activating that font.
      'Charge': ['charge', 'TeX', ['C', '\\fliph{\\text{\u069b}}']],
    },
    identifiersMap: {
      // Variable names
      'a': '\u0623',
      'b': '\u0628',  // TODO: Consider using Arabic letter dotless beh 0x66e instead
      'c': '\u062c\u0640',  // Suffixed with Unicode Arabic Tatweel 0x0640
      'x': '\u0633',
      'y': '\u0635',
      'z': '\u0639',
      'n': '\u0646',

      // Function names
      'f': '\u0642',  // TODO: Consider using dotless qaf (\u066f) instead
      'g': '\u062c\u0640',  // With Unicode Arabic Tatweel 0x0640
      'h': '\u0647\u0640',  // With Unicode Arabic Tatweel 0x0640

      // Mixed use
      'k': '\u0643',
      'r': '\u0631',
      't': '\u062a',
      'd': '\u062f',  // Function, variable and (dx)
      'e': '\u0647\u0640',  // With Unicode Arabic Tatweel 0x0640
      'm': '\u0645',
      'l': '\u0644',

      // Math functions
      'sin': '\u062c\u0627',
      'cos': '\u062c\u062a\u0627',
      'tan': '\u0638\u0627',
      'cot': '\u0638\u062a\u0627',
      'sec': '\u0642\u0627',
      'csc': '\u0642\u062a\u0627',
      'log': '\u0644\u0648'
    },
    numbersMap: {
      '0': '\u0660',
      '1': '\u0661',
      '2': '\u0662',
      '3': '\u0663',
      '4': '\u0664',
      '5': '\u0665',
      '6': '\u0666',
      '7': '\u0667',
      '8': '\u0668',
      '9': '\u0669'
    },
    arabicUnicodeStart: 0x600,
    arabicUnicodeEnd: 0x6FF,
    arabicLanguageRegExp: /([\u0600-\u06FF]+)/g,
    arabicDecimalSplitter: '\u066b',  // Used by `\transn`
    operatorsMap: {
      // English to Arabic punctuations
      ',': '\u060c',
      ';': '\u061b',
      // Limits
      'lim': '\u0646\u0647\u0640\u0640\u0627'
    },
    isArabicPage: function () { 
      return document.documentElement.lang === 'ar';
    }
  }),
  TeX: function (english, arabic) {
    // Creates a translated TeX macro.

    return function (name) {
      var TEX = MathJax.InputJax.TeX;

      var tex;
      if ('ar' === this.stack.env.lang) {
        tex = arabic;
      } else {
        tex = english;
      }

      this.Push(TEX.Parse(tex).mml());
    };
  },
  Text: function (english, arabicText) {
    // Creates a translated TeX macro, with an Arabic plain text.

    return MathJax.Extension.Arabic.TeX(english, '\\fliph{\\text{' + arabicText + '}}');
  },
  Symbols: function (english, arabicSymbols) {
    // Creates a translated TeX macro that converts Arabic symbols into text nodes,
    // and treats everything else as normal TeX.
    var arabic = arabicSymbols.replace(
      MathJax.Hub.config.Arabic.arabicLanguageRegExp,
      '\\fliph{\\text{$1}}'
    );

    return MathJax.Extension.Arabic.TeX(english, arabic);
  },
  MapNumbers: function (text) {
    var numbersMap = MathJax.Hub.config.Arabic.numbersMap;

    var replaceNumber = function (m) {
      return numbersMap[m];
    };

    return text.replace(/[0-9]/g, replaceNumber);
  }
};


MathJax.Hub.Startup.signal.Post('Arabic TeX Startup');


MathJax.Hub.Register.StartupHook('TeX Jax Ready', function () {
  var TEX = MathJax.InputJax.TeX;
  var Arabic = MathJax.Extension.Arabic;

  var texParseMMLToken = TEX.Parse.prototype.mmlToken;
  var dict = MathJax.Hub.config.Arabic.dict;

  var escapeRegExp = (function () {
    var regExpChar = /[\\^$.*+?()[\]{}|]/g;

    return function (string) {
      return string.replace(regExpChar,'\\$&');
    };
  }());

  var getKeysRegExp = function (map) {
    var keys = Object.keys(map).sort(function (a, b) {
      return b.length - a.length;
    });

    return new RegExp(keys.map(escapeRegExp).join('|'), 'gi');
  };


  TEX.Definitions.Add({
    macros: {
      'ar': 'HandleArabic',
      'alwaysar': 'MarkAsArabic',
      'fliph': 'HandleFlipHorizontal',
      'transn': 'TranslateNumbers',
      'tmfrac': 'TranslateMixedFraction',
      'transx': 'TranslateTeX',
      'transt': 'TranslateText',
      'transs': 'TranslateSymbols'
    }
  });

  var array = TEX.Stack.Item.array;
  var arrayClearEnv = array.prototype.clearEnv;
  var arrayInit = array.prototype.Init;

  array.Augment({
    Init: function () {
      // Overcome the copyEnv issue that has been introduced in:
      //  - Pull Request: https://github.com/mathjax/MathJax/pull/1523
      //
      // Otherwise arrays won't be Arabized.
      //  - Bug Report: https://groups.google.com/forum/#!topic/mathjax-dev/cWoTKcwMqmY
      arrayInit.apply(this, arguments);
      this.copyEnv = true;
    },
    clearEnv: function () {
      // Propagate `lang` from Arrays to their children fractions and others.
      // This is a bug in the MathJax itself, so this code should be removed once the bug is fixed.
      // Follow up on https://github.com/mathjax/MathJax/pull/1523
      // It's still not clear how/when a proper solution is possible.
      var lang = this.env.lang;

      arrayClearEnv.apply(this, arguments);

      if (lang) {
        this.env.lang = lang;
      }
    }
  });

  TEX.Definitions.Add({
    macros: function () {
      var definitions = {};

      Object.keys(dict).forEach(function (key) {
        var texCommand = dict[key][0];
        definitions[texCommand] = key;
      });

      return definitions;
    }()
  });


  TEX.Parse.Augment(function () {
    var parsers = {};

    Object.keys(dict).forEach(function (key) {
      var helperName = dict[key][1];  // Text, TeX or Symbols
      var helperParams = dict[key][2];

      parsers[key] = Arabic[helperName].apply(null, helperParams);
    });

    return parsers;
  }());


  TEX.Parse.Augment({
    flipHorizontal: function (token) {
      token.arabicFlipH = !token.arabicFlipH;
        // Invert the value, because flipping twice means, it is not flipped
      return token;
    },
    arabicNumber: function (token) {
      var text = token.data[0].data[0];
      var mapped = Arabic.MapNumbers(text);

      if (mapped !== text) {
        token.data[0].data[0] = mapped;
        token.arabicFontLang = 'ar';
      }

      return this.flipHorizontal(token);
    },
    arabicIdentifier: (function () {
      var identifiersMap = MathJax.Hub.config.Arabic.identifiersMap;
      var identifiersKeysRegExp = getKeysRegExp(identifiersMap);

      var replaceIdentifier = function (m) {
        return identifiersMap[m.toLowerCase()];
      };

      return function (token) {
        var text = token.data[0].data[0];

        if ('chars' === token.data[0].type) {
          // English Symbols like X and Y
          var mapped = text.replace(identifiersKeysRegExp, replaceIdentifier);

          if (mapped !== text) {
            token.data[0].data[0] = mapped;
            token.arabicFontLang = 'ar';
          }
        }

        return this.flipHorizontal(token);
      }
    }()),
    arabicOperator: (function () {
      var operatorsMap = MathJax.Hub.config.Arabic.operatorsMap;
      var operatorsKeysRegExp = getKeysRegExp(operatorsMap);

      var replaceOperator = function (m) {
        return operatorsMap[m];
      };

      return function (token) {
        var text = token.data[0].data[0];
        var mapped = text.replace(operatorsKeysRegExp, replaceOperator);

        if (mapped !== text) {
          token = this.flipHorizontal(token);
          token.arabicFontLang = 'ar';
          token.data[0].data[0] = mapped;
        }

        return token;
      }
    }()),
    _getArgumentMML: function (name) {
      //  returns an argument that is a single MathML element
      //  (in an mrow if necessary)
      //
      //  This functions has been copied here from extensions/TeX/HTML.js, to avoid
      //  adding a dependency.
      //
      //  TODO: Consider importing (as a dependency) this from HTML.js instead!
      var arg = this.ParseArg(name);
      if (arg.inferred && arg.data.length === 1) {
        arg = arg.data[0];
      } else {
        delete arg.inferred;
      }

      return arg;
    },
    mmlToken: function (token) {
      // TODO: Check for possible incompatibility with boldsymbol extension
      var parsedToken = texParseMMLToken.call(this, token);

      if ('ar' === this.stack.env.lang) {
        this.markArabicToken(parsedToken);
      }

      return parsedToken;
    },
    markArabicToken: function (token) {
      if ('mn' === token.type) {
        return this.arabicNumber(token);
      } else if ('mi' === token.type) {
        return this.arabicIdentifier(token);
      } else if ('mo' === token.type) {
        return this.arabicOperator(token);
      }

      return token;
    },
    HandleArabic: function (name) {
      if (MathJax.Hub.config.Arabic.isArabicPage) {
        this.MarkAsArabic(name);
      }
    },
    TranslateTeX: function (name) {
      var english = this.GetArgument(name);
      var arabicText = this.GetArgument(name);
      var helper = Arabic.TeX(english, arabicText);
      return helper.call(this, name);
    },
    TranslateText: function (name) {
      var english = this.GetArgument(name);
      var arabicText = this.GetArgument(name);
      var helper = Arabic.Text(english, arabicText);
      return helper.call(this, name);
    },
    TranslateNumbers: function (name) {
      var english = this.GetArgument(name);
      var arabicDecimalSplitter = MathJax.Hub.config.Arabic.arabicDecimalSplitter;

      var arabicNumbers = Arabic.MapNumbers(english, true)
                                .replace(/,/g, '')
                                .replace(/\./g, arabicDecimalSplitter);

      var helper = MathJax.Extension.Arabic.TeX(
        english, '\\fliph{\\text{' + arabicNumbers + '}}'
      );
      return helper.call(this, name);
    },
    TranslateSymbols: function (name) {
      var english = this.GetArgument(name);
      var arabicText = this.GetArgument(name);
      var helper = Arabic.Symbols(english, arabicText);
      return helper.call(this, name);
    },
    TranslateMixedFraction: function () {
      var integer = this.GetArgument(name);
      var numerator = this.GetArgument(name);
      var denominator = this.GetArgument(name);

      var tex = MathJax.Extension.Arabic.TeX(
        integer + '\\frac{' + numerator + '}{' + denominator + '}',
        '\\alwaysar{\\fliph{\\frac{' + numerator + '}{' + denominator + '}' + integer + '}}'
      );

      return tex.call(this, name);
    },
    MarkAsArabic: function (name) {
      var originalLang = this.stack.env.lang;

      this.stack.env.lang = 'ar';
      var arg = this._getArgumentMML(name);

      this.stack.env.lang = originalLang;  // Reset the language for other elements.

      this.Push(this.flipHorizontal(arg));
    },
    HandleFlipHorizontal: function (name) {
      var arg = this._getArgumentMML(name);
      this.Push(this.flipHorizontal(arg));
    }
  });

  MathJax.Hub.Startup.signal.Post('Arabic TeX Ready');
});

// This file starting with the letter `z` to make sure it gets concatenated last!
MathJax.Ajax.loadComplete("[arabic]/unpacked/arabic.js");
