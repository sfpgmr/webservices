"use strict";
import express from 'express';
const router = express.Router();

import fs from 'fs';
import zlib from 'zlib';

import { exec as exec_ } from 'child_process';
import util from 'util';
import resolveHome from '../resolveHome.mjs';

import queue from 'async/queue';
import bodyParser from 'body-parser';

const exec = util.promisify(exec_);
const homeDir = resolveHome('~/www/blog/');
const repoDir = resolveHome('~/www/blog');
const opt = { cwd: resolveHome('~/www/blog'), maxBuffer: 1000 * 1024};


// コンテンツを更新する処理
const q = queue(
async function (payload) {
  try {
    //process.setuid(process.env['GIT_UID']);
    let res = await exec(`/usr/bin/git -C ${repoDir} fetch --depth 1`, opt);
    console.log(res.stdout,res.stderr);
    res = await exec(`/usr/bin/git -C ${repoDir} reset --hard origin/master`, opt)
    console.log(res.stdout,res.stderr);
    // 変更のあったファイルをgzip圧縮する
    let commits = payload.commits;
    console.log('****commits****',commits.length);
    if (commits.length > 0) {

      for (const commit of commits) {
        let files = [];
        (commit.added && commit.added.length > 0) && (files.push(...commit.added));
        (commit.modified && commit.modified.length > 0) && (files.push(...commit.modified));
        console.log(files.length);
        // 追加更新ファイル
        for (const path of files) {
          console.log(homeDir + path);
          await compressGzip(homeDir + path);
        };
        // 削除ファイル
        if (commit.removed && commit.removed.length > 0) {
          for (const path of commit.removed) {
            await fs.promises.unlink(homeDir + path + '.gz');
          };
        }
      }
    };
  } catch (e) {
    console.log(e.stack);
  }
  //process.setuid(process.env['WWW_UID']);
});

q.drain = ()=>{
  console.log('update content done');
};

function handler(req, res) {

  function hasError(msg) {
    res.writeHead(400, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: msg }))
  }

  if (!req.isXHub) {
    return hasError('No X-Hub Signature.');
  }

  /*if (!req.isXHubValid()) {
     return hasError('X-Hub-Signature is not valid.');
  }*/

  
  const payload = req.body,
    sig = req.headers['x-hub-signature']
    , event = req.headers['x-github-event']
    , id = req.headers['x-github-delivery'];

  console.log('** sig **:', sig, event, id)
  if (event == 'push' && payload.repository.name === 'blog') {
    console.log('プッシュイベントを受信:%s to %s',
      payload.repository.name,
      payload.ref);

    q.push(payload);

    // githubに応答を返す
    res.header({ 'content-type': 'application/json' })
    res.json({ ok: true });
    //await res.end();
    console.log('webhook process is end.');
  }
}

// 
function compressGzip(path) {
  // gzipファイルを作成する
  return new Promise((resolve, reject) => {
    let out = fs.createWriteStream(path + '.gz');
    out.on('finish', resolve.bind(null));

    fs.createReadStream(path)
      .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
      .pipe(out);
    out = void (0);
  });
}

// router.post('/index.html', bodyParser.json({limit:'50mb'}),(req, res,next) => {
//   try {
//     handler(req, res);
//   } catch(e) {
//     console.log(e);
//     next();
//   }
// });

//router.post('/', bodyParser.json({limit:'50mb'}),(req, res,next) => {
router.post('/',(req, res,next) => {
  try {
    handler(req, res);
  } catch(e) {
    console.log(e);
    next();
  }
});

export default router;


