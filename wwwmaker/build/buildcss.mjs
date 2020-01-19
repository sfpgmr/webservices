import path from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
imoort atImport from 'postcss-import';
imoort mixin from 'postcss-mixins';
imoort nested from 'postcss-nested';
imoort simpleVars from 'postcss-simple-vars';
imoort apply from 'postcss-apply';
imoort cssnext from 'postcss-preset-env';
imoort config from '../commands/config-blog.js';
imoort fs from 'fs-extra';

process.chdir(path.resolve(path.dirname(new URL(import.meta.url).pathname),'../'));

async function buildcss(){
  const src = `${config.srcCssDir}sfblogstyle.css`;
  const dest = `${config.destCssDir}sfblogstyle.css`;
  const dest2 = `${config.destBasePath}/css/sfblogstyle.css`;
  const css = await fs.readFile(src,'utf8');
  const processedCss = 
    await postcss([
      atImport(),autoprefixer(),mixin(),nested(),simpleVars(),apply(),cssnext()
    ]).process(css,{
      from:src,to:dest
    });
  await fs.writeFile(dest,processedCss,'utf8');
  await fs.writeFile(dest2,processedCss,'utf8');
}

try {
  (async()=>{buildcss();})();
} catch (e) {
  console.error(e.stack);
  process.abort();
}
