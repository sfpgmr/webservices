(() => {
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
  const ejs = require('gulp-ejs');
  const url = require('url');
  const path = require('path');
  const blogConfig = require('./config-blog');
  

  const srcJsDir = blogConfig.srcJsDir;
  const srcEjsDir = blogConfig.srcEJsDir;
  const srcCssDir = blogConfig.srcCssDir;
  const destJsDir = blogConfig.destJsDir;
  const destCssDir = blogConfig.destCssDir;
  const destEjsDir = blogConfig.destEjsDir;
  const destProtoDir = '../contents/prototype/';
  const sm = require('sitemap');

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

  //HTMLおよびサイトマップのビルド
  gulp.task('html', () => {
    let pages = JSON.parse(fs.readFileSync('./json-ld/wwwpages3.json'));
    let site = JSON.parse(fs.readFileSync('./json-ld/wwwsite.json'));
    let context = pages["@context"];
    let urls = [];
    pages['@graph'].forEach((page, i) => {
      if (page.WebPage) {
        let u = url.parse(page.WebPage.url);
        let filename = path.basename(u.pathname);
        let dir = destEjsDir + path.parse(u.pathname).dir;
        let relativeBase = path.relative(dir,destEjsDir);
        if(relativeBase.length > 0){
          relativeBase += '/';
        }
        console.log(dir,relativeBase);
        let template = page['sf:template'] ? page['sf:template'] : `${srcEjsDir}/template1.html`;
        let stylesheet = page['sf:stylesheet'] ? page['sf:stylesheet'] : './css/sfstyle-home.css';
        page.WebPage["@context"] = context;
        gulp
          //    .src(`${srcEjsDir}/template.html`)
          .src(template)
          .pipe(plumber())
          .pipe(ejs({ page: page.WebPage, site: site,stylesheet:stylesheet,baseUrl:page['sf:baseUrl'],URL:require("url").URL ,path:path,relativeBase:relativeBase,contents:page['sf:contents']}))
          .pipe(rename(filename))
//          .pipe(gulp.dest(`${destEjsDir}`));
          .pipe(gulp.dest(`${dir}`));
          // サイトマップ用データの出力
          urls.push({
            url:page.WebPage.url, changefreq:'weekly',priority:0.5
          });
      }
    });
    // サイトマップの生成
    fs.writeFileSync(`${destEjsDir}sitemap.xml`,sm.createSitemap(
      {
        hostname:'https://www.sfpgmr.net',
        cacheTime:60000,
        urls:urls
      }
    ).toString());
  });

  gulp.task('browser-sync', function () {
    browserSync({
      server: {
        baseDir: `${destEjsDir}`
        , index: "index.html"
      },
      files: [`${destEjsDir}/*.*`, `${destCssDir}/*.*`, `${destJsDir}/*.*`]
    });
  });

  gulp.task('bs-reload', function () {
    browserSync.reload();
  });

  gulp.task('default', ['html', 'postcss', 'browser_js', 'browser-sync'], () => {
    watch(`${srcJsDir}/**/*.js`, () => gulp.start(['browser_js']));
    watch([`${srcEjsDir}/template*.html`, './json-ld/*.json'], () => gulp.start(['html']));
    watch(`${srcCssDir}/**/*.css`, () => gulp.start(['postcss']));
  });
})();