import path from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import atImport from 'postcss-import';
import mixin from 'postcss-mixins';
import nested from 'postcss-nested';
import simpleVars from 'postcss-simple-vars';
import apply from 'postcss-apply';
import postcssPresetEnv from 'postcss-preset-env';
import config from '../commands/config-blog.mjs';
import failOnWarn from 'postcss-fail-on-warn';
import cssVariables from 'postcss-css-variables';
import perfectionist from 'perfectionist';
//import precss  from 'precss';
import fs from 'fs-extra';

process.chdir(path.resolve(path.dirname(new URL(import.meta.url).pathname),'../'));

async function buildcss(){
  const src = `${config.srcCssDir}sfblogstyle.css`;
  const dest = `${config.destCssDir}sfblogstyle.css`;
  const dest2 = `${config.destBasePath}/css/sfblogstyle.css`;
  const css = await fs.readFile(src,'utf8');

  
  const processedCss = await
  postcss([
    autoprefixer,atImport,mixin,nested,simpleVars,apply,cssVariables,postcssPresetEnv({stage:0}),perfectionist
  ]).process(css,{
    from:src,to:dest
  });
  // await postcss([
  //   atImport(),autoprefixer(),mixin(),nested(),simpleVars(),apply(),postcssPresetEnv()
  // ]).process(css,{
  //   from:src,to:dest2
  // });
  //for(const i in processedCss){
  //  console.log(processedCss.messages);
  //}
  await fs.writeFile(dest,processedCss.css,'utf8');
  await fs.writeFile(dest2,processedCss.css,'utf8');
}

try {
  buildcss();
} catch (e) {
  console.error(e.stack);
  process.abort();
}
