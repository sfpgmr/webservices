import fs from 'fs';
import util from 'util';
import path from 'path';
import wwwconfig from './wwwconfig.mjs';
import jsdom from 'jsdom';
import Mecab from 'mecab-async';
const mecab = new Mecab();
mecab.options = {
  maxBuffer: 10000 * 1024,
  timeout: 1000
};

const mecab_parse = util.promisify(mecab.parse).bind(mecab);

const { JSDOM } = jsdom;
let blogEntries;

async function listFile(rootDir, dir, files, dirs) {
  if (!dirs) {
    dirs = await fs.promises.readdir(dir);
  }
  // .mdディレクトリを再帰的に検索する
  for (const d of dirs) {
    let p = dir + d;
    let stats = await fs.promises.stat(p);
    if (stats.isDirectory() && !d.match(/img|images|res|blog|less|scripts|sh|css|js|data|media|webpages|tools/ig)) {
      let relativePath = path.relative(rootDir, p);
      const dirObj = {
        isDirectory: true,
        path: relativePath,
        url: wwwconfig.baseUrl + '/' + relativePath,
        children: []
      };
      let dirs = await fs.promises.readdir(p);
      let indexPage = dirs.find(e => e.match(/index\.html?/ig));
      if (indexPage) {
        dirObj.indexPage = indexPage;
      }
      await listFile(rootDir, p + '/', dirObj.children, dirs);
      if (dirObj.children.length) {
        files.push(dirObj);
      }

    } else if (stats.isFile() && d.match(/\.html?$/)) {
      // ホームページ・ルートディレクトリを基準とした相対パスを取得する
      let relativePath = path.relative(rootDir, p);
      let basename = path.basename(d);

      // load dom
      const { window } = await JSDOM.fromFile(p);
      const { document } = window;
      // get meta description
      let description = document.querySelector('meta[name = "description"]');
      description = description ? description.content : undefined;
      // get title tag
      let title = document.querySelector('title');
      title = title ? title.textContent : undefined;
      // get meta keywords
      let keywords = document.querySelector('meta[name = "keywords"]');
      keywords = keywords ? keywords.content : undefined;

      // ブログからリンクしているか調べる
      let relatedLinks = [];
      let baseMatch = new RegExp(relativePath.replace(/\//g,'\\/'),"ig");
      console.log(relativePath);

      for(const blogEntry of blogEntries){
        const blogPosting = blogEntry.blogPosting;
        if(blogPosting.url && blogPosting.datePublished != 'draft'){
          if(!blogEntry.md) {
            blogEntry.md = await fs.promises.readFile(blogEntry.mdPath,'utf8');
          }  
          const text = blogEntry.md;
          if(text.match(baseMatch)){
            console.log(basename);
            relatedLinks.push(blogPosting.url);
          } else if(basename.match(/index\.html?/)){
            console.log(path.dirname(relativePath));
            let m = new RegExp(path.dirname(relativePath).replace(/\//g,'\\/'),'ig');
            if(text.match(m)){
              relatedLinks.push(blogPosting.url);
            }
          }
        }
      }

      // let about = document.querySelector('body');
      // let vocabs;
      // if(about){
      //   const text = about.textContent.replace(/\s+/g,' ');//.substr(0,128):undefined;
      //   vocabs = await mecab_parse(text);
      //   vocabs = vocabs.filter(v=>v[2]=='固有名詞'&&(!v[0].match(/\w/i))).map(v=>v[0]).filter((x, i, self)=>self.indexOf(x) === i);
      // }

      files.push({
        path: relativePath,
        url: wwwconfig.baseUrl + '/' + relativePath,
        description: description,
        title: title,
        keywords: keywords,
        relatedLink:relatedLinks.length ? relatedLinks : undefined
        //vocabs:vocabs
        //about:about
      });
    }
  }
  return files;
}

try {
  (async () => {
    const files = [];
    blogEntries = JSON.parse(await fs.promises.readFile('./data/blog/entries.json'));
    await listFile(wwwconfig.root, wwwconfig.root, files);
    await fs.promises.writeFile('./data/data.json', JSON.stringify(files, null, 1), 'utf8');
  })();
} catch (e) {
  console.error(e.stack);
}
