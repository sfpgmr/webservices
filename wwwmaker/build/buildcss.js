'use strict';


const path = require('path');

process.chdir(path.resolve(
  __dirname,'../'
));

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const atImport = require('postcss-import');
const mixin = require('postcss-mixins');
const nested = require('postcss-nested');
const simpleVars = require('postcss-simple-vars');
const apply = require('postcss-apply');
const cssnext = require('postcss-preset-env');
const config = require('../commands/config-blog');
const fs = require('fs-extra');

async function buildcss(){
  const src = `${config.srcCssDir}sfblogstyle.css`;
  const dest = `${config.destCssDir}sfblogstyle.css`;
  const css = await fs.readFile(src,'utf8');
  const processedCss = 
    await postcss([
      atImport(),autoprefixer(),mixin(),nested(),simpleVars(),apply(),cssnext()
    ]).process(css,{
      from:src,to:dest
    });
  await fs.writeFile(dest,processedCss,'utf8');
}

if(require.main === module){
  buildcss();
} else {
  module.exports = buildcss;
}




