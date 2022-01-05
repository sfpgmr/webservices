"use strict";
//import Router from 'koa-router';
//const router = new Router();

import fs from 'fs';
import zlib from 'zlib';

import { exec as exec_ } from 'child_process';
import util from 'util';
import resolveHome from '../resolveHome.mjs';

import async from 'async';

const queue = async.queue;

const exec = util.promisify(exec_);
const homeDir = resolveHome('~/www/blog/');
const repoDir = resolveHome('~/www/blog');
const opt = { cwd: resolveHome('~/www/blog'), maxBuffer: 3000 * 1024 };


// コンテンツを更新する処理
const q = queue(
  async function (payload) {
    try {
      //process.setuid(process.env['GIT_UID']);
      let res = await exec(`/usr/bin/git -C ${repoDir} fetch --depth 1`, opt);
      console.log(res.stdout, res.stderr);
      res = await exec(`/usr/bin/git  reset --hard origin/master`, opt);
      res = await exec(`/usr/bin/git --no-pager -C ${repoDir} diff ${payload.before}...HEAD -C -M --name-status --relative`, opt);

      let files = res.stdout.split(/\n/g)
        .map(d => {
          let ret = d.split(/\t/g);
          ret[1] = homeDir + ret[1];
          return ret;
        })
        .filter(d => d[0] != '');

      for (const d of files) {
        switch (d[0]) {
          /* 追加 */
          /* 更新 */
          case 'A':
            await compressGzip(d[1]);
            console.log('appended:', d[1]);
            break;
          case 'M':
            await compressGzip(d[1]);
            console.log('modified:', d[1]);
            break;
          /* 削除 */
          case 'D':
            await fs.promises.unlink(d[1] + '.gz');
            console.log('deleted:', d[1]);
            break;
        }
      }
      console.log('****gzip end****');
    } catch (e) {
      console.log(e.stack);
    }
    //process.setuid(process.env['WWW_UID']);
  }
);

q.drain(() => {
  console.log('update content done');
});

// function handler(ctx) {
//   const req = ctx.request;
//   const res = ctx.response;

//   function hasError(msg) {
//     res.writeHead(400, { 'content-type': 'application/json' })
//     res.end(JSON.stringify({ error: msg }))
//   }

//   if (!req.isXHub) {
//     ctx.throw(403,'No X-Hub Signature.');
//   }

//   if (!req.isXHubValid()) {
//     ctx.throw(403,'X-Hub-Signature is not valid.');
//   }


//   const payload = req.body,
//     sig = req.headers['x-hub-signature']
//     , event = req.headers['x-github-event']
//     , id = req.headers['x-github-delivery'];

//   console.log('** sig **:', sig, event, id)
//   if (event == 'push' && payload.repository.name === 'blog') {
//     console.log('プッシュイベントを受信:%s to %s',
//       payload.repository.name,
//       payload.ref);

//     q.push(payload);

//     // githubに応答を返す
//     ctx.header({ 'content-type': 'application/json' });
//     ctx.body = { ok: true };
//     //await res.end();
//     console.log('webhook process is end.');
//   }
// }

function handler(ctx){
  q.push(ctx.webhook);
  ctx.type ="json";
  ctx.body = { ok: true };
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
function webhookHandler (){
  return async (ctx,next)=>{
    try {
      handler(ctx);
    } catch (e) {
      console.log(e);
    }
    await next();
  }
}

export default webhookHandler;


