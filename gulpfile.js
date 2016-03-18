'use strict';

//npm install gulp del gulp-clean-css gulp-htmlclean gulp-jshint gulp-zip --save-dev

var gulp = require('gulp'),
    del = require('del'),
    htmlclean = require('gulp-htmlclean'),
    cleanCSS = require('gulp-clean-css'),
    jshint = require('gulp-jshint'),
    zip = require('gulp-zip');

gulp.task('clean', function() {
    return del(['build/**']);
});

//copy static folders to build directory
gulp.task('copy', function() {
    gulp.src('assets/**')
        .pipe(gulp.dest('build/assets'));
    gulp.src('lib/*.js')
        .pipe(gulp.dest('build/lib'));
    return gulp.src('manifest.json')
        .pipe(gulp.dest('build'));
});

gulp.task('html', function() {
    return gulp.src('./*.html')
        .pipe(htmlclean())
        .pipe(gulp.dest('build'));
});

gulp.task('jshint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('scripts', ['jshint'], function() {
    return gulp.src(['js/*.js'])
        .pipe(gulp.dest('build/js'));
});

gulp.task('styles', function() {
      return gulp.src('css/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('build/css'));
});

gulp.task('chrome', ['html', 'scripts', 'styles', 'copy'], function() {
    var manifest = require('./manifest'),
        distFileName = manifest.name + ' v' + manifest.version + '.zip';
    return gulp.src(['build/**'])
        .pipe(zip(distFileName))
        .pipe(gulp.dest('dist'));
});

gulp.task('firefox', ['html', 'scripts', 'styles', 'copy'], function() {
    var manifest = require('./manifest'),
        distFileName = manifest.name + ' v' + manifest.version + '.xpi';
    return gulp.src(['build/**'])
        .pipe(zip(distFileName))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['clean'], function() {
    gulp.start('chrome');
});
