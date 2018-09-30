'use strict';

const Blog = require('hatena-blog-api2').Blog;
const fs = require('fs-extra');

const client = new Blog({
  type: 'wsse',
  userName: process.env['HATENA_USERNAME'],
  blogId: process.env['HATENA_BLOGID'],
  apiKey: process.env['HATENA_APIKEY']
});

let ps = Promise.resolve();
let entries = [];
function list(d)
{
  
  entries = entries.concat(d.res.feed.entry);

  // 次のフィードを呼び出す
  const links = d.res.feed.link;
  const next = links.filter((d)=>d.$.rel == 'next');
  if(next && next[0]){
    let regexp = /\?page\=([0-9]*)$/;
    let maches = regexp.exec(next[0].$.href);
    let page = maches[1];
    ps = ps.then(client.getEntries.bind(client,page))
      .then(list);
  } else {
    fs.outputFileSync('./data/hidden/entry.json',JSON.stringify(entries,null,1));
  }
}

ps = 
  ps.then(client.getEntries.bind(client))
    .then(list);
