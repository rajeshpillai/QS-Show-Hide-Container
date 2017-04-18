"use strict";
var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    ignore = require('gulp-ignore'),
    gutil = require('gulp-util'),
    babel = require('gulp-babel'),
    minifyCSS = require('gulp-clean-css'),
    del = require('del'),
    runSequence = require('run-sequence');

gulp.task('minifycss', function () {
  gulp.src('libs/*.css')
    .pipe(minifyCSS({ keepBreaks: false }))
    .pipe(gulp.dest('dist'));
});

gulp.task('minifyjs', function () {
  gulp.src(['FEI-ShowHide.js','getMasterItems.js', 'libs/*.js'],
    {base: '.'})
    .pipe(ignore.exclude(["**/*.map"]))
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify().on('error', gutil.log))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy', function () {
  gulp.src(['FEI-ShowHide.qext','FEI-ShowHide.png', 'properties.js', 'wbfolder.wbl'])
    .pipe(gulp.dest('dist'));
});

gulp.task('cleanup', function (){
  return del('dist/**', {force: true});
});

gulp.task('prod', function () {
  runSequence(
    'cleanup',
    ['minifycss', 'minifyjs','copy']);
});

