var gulp = require('gulp');
var path = require('path');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var order = require('gulp-order');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');

var unicodeEscapeArabicChars = function (match) {
  // Replaces arabic chars with their unicode equivalent.
  var hexCharCode = match.charCodeAt(0).toString(16);
  var zeroPrefixed = ('0000' + hexCharCode).slice(-4);
  return '\\u' + zeroPrefixed;
};

var arabicCharsRegExp = /[^\x00-\x7F]/g;

gulp.task('browser-sync', function () {
  browserSync({
    port: process.env.PORT || 3000,
    server: {
      baseDir: __dirname
    }
  });
});


gulp.task('bs-reload', function () {
  browserSync.reload();
});


gulp.task('scripts-concat', function () {
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
});


gulp.task('scripts-pack', function () {
  return gulp.src(path.join(__dirname, 'dist/unpacked/arabic.js'))
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(uglify({
      preserveComments: 'some'
    }))
    .pipe(replace(arabicCharsRegExp, unicodeEscapeArabicChars))
    .pipe(replace('[arabic]/unpacked/arabic.js', '[arabic]/arabic.js'))
    .pipe(gulp.dest(path.join(__dirname, 'dist/')));
});

gulp.task('styles-concat', function () {
  return gulp.src(path.join(__dirname, 'src/css/*.css'))
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(concat('arabic.css'))
    .pipe(gulp.dest(path.join(__dirname, 'dist/unpacked/')));
});

gulp.task('styles-pack', function () {
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
});

gulp.task('build-and-reload', function () {
  runSequence(
    'scripts-concat',
    'scripts-pack',
    'styles-concat',
    'styles-pack',
    'bs-reload'
  );
});

gulp.task('default', ['build-and-reload', 'browser-sync'], function () {
  gulp.watch(path.join(__dirname, 'src/**/*.{js,css}'), ['build-and-reload']);
  gulp.watch(path.join(__dirname, 'testcases/**/*.{html,css,js,yml}'), ['build-and-reload']);
  gulp.watch(path.join(__dirname, 'mathjax/unpacked/jax/input/TeX/**/*.js'), ['bs-reload']);
});
