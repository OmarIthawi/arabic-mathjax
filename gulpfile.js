var gulp = require('gulp');
var path = require('path');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var order = require('gulp-order');
var replace = require('gulp-replace');

var unicodeEscapeArabicChars = function (match) {
  // Replaces arabic chars with their unicode equivalent.
  var hexCharCode = match.charCodeAt(0).toString(16);
  var zeroPrefixed = ('0000' + hexCharCode).slice(-4);
  return '\\u' + zeroPrefixed;
};

var arabicCharsRegExp = /[^\x00-\x7F]/g;

function scriptsConcat() {
  return gulp.src(path.join(__dirname, 'src/*.js'))
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(order([
      'license.js',
      '*.js'
    ]))
    .pipe(concat('arabic.js'))
    .pipe(replace(arabicCharsRegExp, unicodeEscapeArabicChars))
    .pipe(gulp.dest(path.join(__dirname, 'dist/unpacked/')));
}

function scriptsPack() {
  return gulp.src(path.join(__dirname, 'dist/unpacked/arabic.js'))
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(uglify({
      // Keep the bundle ES5: uglify-js 3 rewrites IIFEs to arrow functions
      // by default, which would retarget the shipped artifact to ES6.
      compress: {
        arrows: false
      },
      output: {
        ecma: 5,
        // Keep the leading `/*! ... */` license banner. uglify-js 3's
        // 'some' preset no longer honours the `!` prefix, so match it directly.
        comments: /^!/
      }
    }))
    .pipe(replace(arabicCharsRegExp, unicodeEscapeArabicChars))
    .pipe(replace('[arabic]/unpacked/arabic.js', '[arabic]/arabic.js'))
    .pipe(gulp.dest(path.join(__dirname, 'dist/')));
}

function stylesConcat() {
  return gulp.src(path.join(__dirname, 'src/css/*.css'))
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(concat('arabic.css'))
    .pipe(gulp.dest(path.join(__dirname, 'dist/unpacked/')));
}

function stylesPack() {
  return gulp.src(path.join(__dirname, 'dist/unpacked/arabic.css'))
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(uglifycss({
      maxLineLen: 80
    }))
    .pipe(gulp.dest(path.join(__dirname, 'dist/')));
}

function bsReload(done) {
  browserSync.reload();
  done();
}

// Build the unpacked and packed JS/CSS bundles.
var build = gulp.series(scriptsConcat, scriptsPack, stylesConcat, stylesPack);

// Build everything then trigger a live-reload in the browser.
var buildAndReload = gulp.series(build, bsReload);

// MathJax v2 is vendored via the `mathjax` npm package. The testcases load it
// from `/mathjax/...` when developing locally, so map that URL onto the package.
var mathjaxDir = path.join(__dirname, 'node_modules/mathjax');

function serve() {
  browserSync.init({
    port: process.env.PORT || 3000,
    server: {
      baseDir: __dirname,
      routes: {
        '/mathjax': mathjaxDir
      }
    }
  });

  gulp.watch(path.join(__dirname, 'src/**/*.{js,css}'), buildAndReload);
  gulp.watch(path.join(__dirname, 'testcases/**/*.{html,css,js,yml}'), buildAndReload);
  gulp.watch(path.join(mathjaxDir, 'unpacked/jax/input/TeX/**/*.js'), bsReload);
}

exports.build = build;
exports.serve = serve;
exports.default = gulp.series(build, serve);
