'use strict';

const fs = require('fs');
const gulp = require('gulp');
const logger = require('gulp-logger');
const watch = require('gulp-watch');
const source = require('vinyl-source-stream');
const plumber = require('gulp-plumber');

const browserSync = require('browser-sync');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const autoprefixer = require('autoprefixer');
const atImport = require('postcss-import');

const rollup = require('rollup').rollup;
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const gulpEjs = require('gulp-ejs');
const ejs = require('ejs');
const url = require('url');
const path = require('path');
//const mdToHtml = require('./md-to-html');
const config = require('./config-blog');

const sm = require('sitemap');

// JSのビルド
gulp.task('browser_js', () => {
  rollup({
    entry: `${config.srcJsDir}sfblogstyle.js`,
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
      dest: `${config.destJsDir}sfblogstyle.js`,
      sourceMap: 'inline'
    });
  });
});

// CSSのビルド
gulp.task('postcss', function () {
  gulp.src(`${config.srcCssDir}*.css`)
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
    .pipe(gulp.dest(config.destCssDir))
    .pipe(logger({ beforeEach: '[postcss] wrote: ' }));
  gulp.start(['bs-reload']);
});

//HTMLおよびサイトマップのビルド
gulp.task('html', () => {
  //mdToHtml({});
  // // サイトマップの生成
  // fs.writeFileSync(`${destEjsDir}sitemap.xml`, sm.createSitemap(
  //   {
  //     hostname: 'https://blog.sfpgmr.net',
  //     cacheTime: 60000,
  //     urls: urls
  //   }
  // ).toString());
});

// gulp.task('browser-sync', function () {
//   browserSync({
//     server: {
//       baseDir: `${config.destEjsDir}`
//       , index: "index.html"
//     },
//     files: [`${config.destEjsDir}/*.*`, `${config.destCssDir}/*.*`, `${config.destJsDir}/*.*`]
//   });
// });

// gulp.task('bs-reload', function () {
//   browserSync.reload();
// });

gulp.task('default', ['postcss', 'browser_js'/*, 'browser-sync'*/], () => {
  watch(`${config.srcJsDir}/**/*.js`, () => gulp.start(['browser_js']));
  //watch([`${config.srcEjsDir}/template*.html`, './json-ld/*.json'], () => gulp.start(['html']));
  watch(`${config.srcCssDir}/**/*.css`, () => gulp.start(['postcss']));
});
