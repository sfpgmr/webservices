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

const regJson = /<script type="application\/json" id="sfblog">([\s\S\r\n]*?)<\/script>/i;

listFile(config.mdDir);

for(const filePath of filePaths){
  let doc = fs.readFileSync(filePath,'utf-8');
  regJson.lastIndex = 0;
  const matches = regJson.exec(doc);
  if(matches){
    regJson.lastIndex = 0;
    const obj = JSON.parse(matches[1]);
    if(obj.blogPosting.description){
      delete obj.blogPosting.description;
      regJson.lastIndex = 0;
      doc = doc.replace(regJson,'<script type="application/json" id="sfblog">' + JSON.stringify(obj,null,' ') + '</script>');
      console.log(doc);
      fs.writeFileSync(filePath,doc,'utf-8');
    } 
  }
}
