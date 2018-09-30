'use strict';
const zlib =require('zlib');
const URL = require('url').URL;
const path = require('path');
const fs = require('fs-extra');
const blogConfig = require('./config-blog');
//const config = JSON.parse(fs.readFileSync('./data/blog/config.json'));
const util = require('util');
const sm = require('sitemap');

// サイトマップの生成
async function generateSiteMap(docs,urls,archiveDate)
{
  const sitemap = sm.createSitemap({
    cacheTime: 600000,
    urls:urls
  });


 let filePaths = [];
  async function listFile(mdDir) {
    // .mdディレクトリを再帰的に検索する
    let dirs = fs.readdirSync(mdDir);
    dirs.forEach((d) => {
      let mdPath = mdDir + d;
      let stats = fs.statSync(mdPath);
      if (stats.isDirectory() && !d.match(/blog|less|scripts|sh/ig)) {
        listFile(mdPath + '/');
      } else if (stats.isFile() && d.match(/\.html?$/)) {
        sitemap.add(
          {
            url:blogConfig.siteUrl + mdPath.replace(/\.\.\/contents\//,''),
            changefreq:'weekly',
            priority:0.6,
            lastmodrealtime: true,
            lastmodfile:mdPath            
          }
        );
      }
    });
  }

  await listFile(blogConfig.destEjsDir);

  // sitemap index 
  const outPathSmi = blogConfig.destEjsDir + 'sitemap-web.xml';
  await fs.outputFile(outPathSmi,sitemap.toString(),'utf-8');
  await compressGzip(outPathSmi);
}

function compressGzip(path) {
  // gzipファイルを作成する
  return new Promise((resolve, reject) => {
    var out = fs.createWriteStream(path + '.gz');
    out.on('finish', resolve.bind(null));

    fs.createReadStream(path)
      .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
      .pipe(out);
    out = void (0);
  });
}

generateSiteMap();

