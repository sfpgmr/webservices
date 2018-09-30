'use strict';

import gulp from 'gulp';
import logger from 'gulp-logger';
import watch from 'gulp-watch';
import plumber from 'gulp-plumber';

import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import atImport from 'postcss-import';

import rollup from 'gulp-rollup-each';
import commonjs  from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import blogConfig from './src/node/config-blog.js';

const srcJsDir = blogConfig.srcJsDir;
const srcEjsDir = blogConfig.srcEJsDir;
const srcCssDir = blogConfig.srcCssDir;
const destJsDir = blogConfig.destJsDir;
const destCssDir = blogConfig.destCssDir;
const destEjsDir = blogConfig.destEjsDir;
const destProtoDir = '../contents/prototype/';

// JSのビルド
gulp.task('browser_js', () => {
  rollup({
    entry: `${srcJsDir}sfstyle.js`,
    plugins: [
      nodeResolve({ jsnext: true }),
      commonjs()
    ],
    external: [
      'events'
    ]
  }).then((bundle) => {
    bundle.write({
      format: 'iife',
      dest: `${destJsDir}sfstyle.js`,
      sourceMap: 'inline'
    });
  });
});

// CSSのビルド
gulp.task('postcss', function () {
  gulp.src(`${srcCssDir}*.css`)
    .pipe(plumber())
    .pipe(postcss([
      atImport(),
      require('postcss-mixins')(),
      require('postcss-nested')(),
      require('postcss-simple-vars')(),
      require('postcss-apply')(),
      require('cssnext')(),
      //           require('cssnano')(),
      autoprefixer({ browsers: ['last 1 versions'] })
    ]))
    .pipe(gulp.dest(destCssDir))
    .pipe(logger({ beforeEach: '[postcss] wrote: ' }));
});

gulp.task('default', () => {
  gulp.src(`${blogConfig.srcNodeDir}*.js`)
    .pipe(plumber())
    .pipe(rollup({
      plugins:[
 //       nodeResolve({ jsnext: true }),
 //       commonjs()
      ]
    },{
      format:'cjs'
    }))
    .pipe(gulp.dest('./'));

  // watch([`${blogConfig.srcNodeDir}*.js`])
  //   .pipe(plumber())
  //   .pipe(rollup({
  //     plugins:[
  //       nodeResolve({ jsnext: true }),
  //       commonjs()
  //     ]
  //   }))
  //   .pipe(gulp.dest('./'));
});
