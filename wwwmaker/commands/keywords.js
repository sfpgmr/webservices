"use strict";

const fs = require('fs-extra');
const path = require('path');
const config = require('./config-blog.js');

let filePaths = [];
function listFile(mdDir) {
  // .mdディレクトリを再帰的に検索する
  let dirs = fs.readdirSync(mdDir);
  dirs.forEach((d) => {
    let mdPath = mdDir + d;
    let stats = fs.statSync(mdPath);
    if (stats.isDirectory()) {
      listFile(mdPath + '/');
    } else if (stats.isFile() && d.match(/\.md$/)) {
      filePaths.push(mdPath);
    }
  });
}

const regJson = /<script type="application\/json" id="sfblog">([\s\S\r\n]*?)<\/script>/ig;

listFile(config.mdDir);


function generatePermutation(perm, pre, post, n) {
  var elem, i, rest, len;
  if (n > 0)
    for (i = 0, len = post.length; i < len; ++i) {
      rest = post.slice(0);
      elem = rest.splice(i, 1);
      generatePermutation(perm, pre.concat(elem), rest, n - 1);
    }
  else
    perm.push(pre);
}


let convertFiles = [];
let keywords = new Map();
let links = [];
for(const filePath of filePaths){
  let doc = fs.readFileSync(filePath,'utf-8');
  const matches = regJson.exec(doc);
  if(matches){
    const obj = JSON.parse(matches[1]);
    const ks = obj.blogPosting.keywords ? obj.blogPosting.keywords.split(',') : [];
    for(const keyword of ks){
      let v = keywords.get(keyword);
      if(!v){
        keywords.set(keyword,1);
      } else {
        v = v + 1;
        keywords.set(keyword,v);
      }
    }
    let perm = [];
    generatePermutation(perm,[],ks,2);
    for(const n of perm){
      let find = links.some((link)=>{
        let ret = link.source == n[0] && link.target == n[1];
        if(ret) {
          link.value += 1;
        }
        return ret;
      });
      if(!find) links.push({source:n[0],target:n[1],value:1});
    }
    //console.log(perm);
    // console.log(obj.blogPosting.keywords);
    //fs.writeFileSync(filePath,doc,'utf-8');
    //convertFiles.push(filePath);
  }
  regJson.lastIndex = 0;
}

let obj = {nodes:[],links:links}; 

for(const kv of keywords){
  obj.nodes.push({id:kv[0],group:1,count:kv[1]});
}

for(const link of links){
  let s = false,t = false;
  obj.nodes.some((node)=>{

    let st = !s && node.id == link.source;

    if(st && !s){
      node.linkCount = node.linkCount ? node.linkCount += 1:node.linkCount = 1;
      s = true;
    }

    let tt = !t && node.id == link.target;
    if(tt && !t){
      node.linkCount = node.linkCount ? node.linkCount += 1:node.linkCount = 1;
      t = true;
    }
    return s && t;
  });
}

fs.writeFileSync(config.destEjsDir + '/dev/force-directed/keywords.json',JSON.stringify(obj,null,' '),'utf-8');
