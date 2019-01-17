"use strict";
import express from 'express';
const router = express.Router();

import fs from 'fs';
import zlib from 'zlib';

import {exec as exec_} from 'child_process';
import util from 'util';

const exec = util.promisify(exec_);
const homeDir = '~/www/html/';
const opt = {cwd:'~/www/html'};

function handler(req,res){
  
  function hasError (msg) {
    res.writeHead(400, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: msg }))
  }

  if(!req.isXHub){
    return hasError('No X-Hub Signature.');
  }

  if(!req.isXHubValid()){
    return hasError('X-Hub-Signature is not valid.');
  }

  const payload = req.body,
      sig   = req.headers['x-hub-signature']
      , event = req.headers['x-github-event']
      , id    = req.headers['x-github-delivery'];

  
    if(event == 'push' && payload.repository.name === 'www'){
      console.log('プッシュイベントを受信:%s to %s',
      payload.repository.name,
      payload.ref);

      // githubに応答を返す
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{"ok":true}');

      exec('/usr/bin/git fetch --depth 1',opt)
      .then(s=>exec('/usr/bin/git reset --hard origin/master',opt))
      .then(s=>{
        // 変更のあったファイルをgzip圧縮する
        let commits = payload.commits;
        let pr = Promise.resolve(0);
        (commits.length > 0) && commits.forEach(commit=>{
          let files = [];
          (commit.added && commit.added.length > 0) && (files.push(...commit.added));
          (commit.modified && commit.modified.length > 0) && (files.push(...commit.modified));
  
          //console.log(commit,files);
          // 追加更新ファイル
          files.forEach(path=>{
            pr = pr.then(compressGzip.bind(null,homeDir + path));
          });
          // 削除ファイル
          if(commit.removed && commit.removed.length > 0){
            commit.removed.forEach(path=>{
              pr = pr.then(fs.promises.unlink.bind(null,homeDir + path + '.gz'));
            });
          }
        });
        pr = pr.then(()=>console.log('webhook process is end.'));
        return pr;
      })
      .catch((e)=>{console.log(`Error:${e}`);});
    }

}

function compressGzip(path) {
    // gzipファイルを作成する
    return new Promise((resolve,reject)=>{
      var out = fs.createWriteStream(path + '.gz');
      out.on('finish', resolve.bind(null));
    
      fs.createReadStream(path)
        .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
        .pipe(out);
      out = void(0);                  
    });
}

router.use('/index.html',(req,res,next)=>{
  handler(req,res);
});

router.use('/',(req,res,next)=>{
  handler(req,res);
});

export default router;


