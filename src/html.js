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
