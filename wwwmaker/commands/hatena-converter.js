'use strict';
const fs = require('fs-extra');
/* eslint-disable no-console */
const hatenaData = JSON.parse(fs.readFileSync('./data/hidden/entry.json'));
const blogConfig = require('./config-blog');
const outDir = './data/blog/contents/';
const URL = require('url').URL;
const uuid = require('uuid');
const htmlEncode = require('js-htmlencode').htmlEncode;

fs.removeSync(outDir);

hatenaData.some((blogPost, idx) => {
  const blogProps = {};
  let blogData = '';
  const title = htmlEncode(blogPost.title._);
  blogPost.link.some((link) => {
    if (link.$.rel == "alternate") {
      let url = new URL(link.$.href);
      url.host = url.host.replace(/blog/i,'www');
      url.pathname = '/blog' + url.pathname + '.html';
      url.protocol = 'https';
      blogProps.url =url.toString();
      return true;
    }
  });
  blogProps.datePublished = blogPost.published._;
  //blogProps.dateCreated = blogPost.published._;
  //blogProps.dateUpdated = blogPost.updated._;
  blogProps.dateModified = blogPost['app:edited']._;
  blogProps.description = (blogPost.summary._ + '').replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/"/g, '\\"').replace(/&/g, '\\u0026').replace(/`/g, '\\u0027').replace(/\//g, '\\u002f');
  let content = blogPost.content._ || '';
  blogProps.keywords = blogPost.category ? (!blogPost.category.map
    ? blogPost.category.$.term
    : blogPost.category.map(d => d.$.term).join(',')) : '';
  if (blogPost['app:control']['app:draft']._ == 'yes') {
    blogProps.datePublished = 'draft';
  }
  const bp = {
    blogPosting: blogProps,
    blogId:blogConfig.siteUrl + uuid.v4()
  };

  //コンテンツの変換

  content = content
    // Youtube URL
    .replace(/http:\/\/www\.youtube\.com/ig,'https://www.youtube.com')
    // github URL
    .replace(/http:\/\/github\.sfpgmr\.net/ig,'https://github.sfpgmr.net')
    // 旧Blog URL
    .replace(/http:\/\/blog\.sfpgmr\.net/ig,'https://blog.sfpgmr.net')
    // bl.ocks.org
    .replace(/http:\/\/bl\.ocks\.org/ig,'https://bl.ocks.org')
    // Syntax Highlighter
    .replace(/<pre.*?class="brush:([^"]*)"[^>]*>([\s\S]*?)<\/pre>/ig,function(){
      const code =`
\`\`\`${arguments[1].trim()}
${arguments[2]} 
\`\`\`
`;
      console.log(code);
      return code;
    });

  //  const prematches = (/<pre.*?class="brush:([^"]*)"[^>]*>([\s\S]*?)<\/pre>/ig).exec(content);
  //  if(prematches){
  //    console.log(prematches);
  //  }

  //HTMLタグ内に囲まれている/囲まれていないリンクタグの処理

  //  const rehatena = /(?:<("[^"]*"|'[^']*'|[^'">])*>)?[^\[]*\[(https?:\/\/.*?)\:image(^\])*?][^\[]*(?:<("[^"]*"|'[^']*'|[^'">])*>)?/ig;
  //  const rehatena = /\[(https?:\/\/.*?)\:image(^\])*?\]/ig;
  // はてな記法
  const rehatena = /\[((https?):(?:\/\/)?([^:\[\]]*)):?(title|image|embed)?=?([^\[\]]*)?\](?:\(([^(]*?)\))?/ig;
  //  const rehatena = /\[((http(?:s?)|asin):(?:\/\/)?([^\:\[\]]*))\:?(title|image|embed)?=?([^\[\]\:]*?)?\]/ig;
  //  const rehatena = /\[((asin):\/\/([^:\[\]]*))\:?(title|image|embed)?=?([^\[\]]*)?\]/ig;

  // const matches  = rehatena.exec(content);
  // if(matches /*& matches[2] == 'asin'*/){
  //   console.log(matches.join(',') + '<eot>');
  // }

  content = content.replace(rehatena,(...args)=>{
    if(args[4] == 'image'){
      return `![${args[1]}](${args[1]})`;
    } else if(args[3] == 'title' && args[4].length){
      return `[${args[4]}](${args[1]})`;
    } else if(args[6]){
      return args[0];
    } else {
      return `[${args[1]}](${args[1]})`;
    }
  });

  rehatena.lastIndex = 0;

  blogData +=
`# ${title}
<script type="application/json" id="sfblog">
${JSON.stringify(bp, null, 1)}
</script>

[adsense:]

${content}
`;

  let dt = new Date(blogPost.published._);
  let fpath = dt.getFullYear() + '/' + ('0' + (dt.getMonth() + 1)).slice(-2) + '/';
  fs.mkdirsSync(outDir + fpath);
  fs.writeFileSync(`${outDir + fpath}hatena${('000000' + idx).slice(-6)}.md`, blogData, 'utf-8');
});
