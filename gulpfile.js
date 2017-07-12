"use strict";

var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var jasmineBrowser = require('gulp-jasmine-browser');

gulp.task('test_node', function() {
  return gulp.src(['node_spec/**/*.js'])
          .pipe(jasmine());
});

gulp.task('test_browser', function() {
  return gulp.src(['src/**/*.js', 'browser_spec/**/*_spec.js'])
          .pipe(jasmineBrowser.specRunner({console: true}))
          .pipe(jasmineBrowser.headless({driver: 'chrome'}));
});

gulp.task('test', ['test_node', 'test_browser']);
