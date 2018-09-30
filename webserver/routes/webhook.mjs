"use strict";
import express from 'express';
const router = express.Router();

import fs from 'fs';
import zlib from 'zlib';

import {exec as exec_} from 'child_process';
import util from 'util';

//import createHandler from 'github-webhook-handler';
//const secret = fs.readFileSync('/var/www/node/keys/webhook/secret','utf-8').trim();
// function exec(command,opt){
//   return new Promise((resolve,reject)=>{
//     exec_(command,opt,(error,stdout,stderr)=>{
//       if(error){
//         reject(error);
//       }
//       resolve(stdout,stderr);
//     });
//   });
// }
const exec = util.promisify(exec_);
const homeDir = '/var/www/html/';
const opt = {cwd:'/var/www/html'};
//const handler = createHandler({ path: '/', secret: secret});


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

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{"ok":true}');

      exec('/usr/bin/git pull',opt)
      //exec('/usr/bin/git reset --hard origin/master',opt)
      .then((s)=>{
        // git diffをとって変更のあったファイル一覧を取得する
        var commitIDs = s.stdout.split(/\n/);
        console.log(commitIDs);
        console.log(payload.after,payload.before);
        return exec(`/usr/bin/git diff --name-only ${payload.after} ${payload.before}`,opt);    
      })
      .then((s)=>{
        // 変更のあったファイルをgzip圧縮する
        //console.log(stdout);
        let files = s.stdout.split(/\n/);
        let pr = Promise.resolve(0);
        files.forEach((d,i)=>{
          let path  = d.trim();
          if(path.length > 0){          
            pr = pr
              .then(compressGzip.bind(null,homeDir + path))
              .then(exec.bind(null,`/bin/chown ${process.env['WWW_UID']}:${process.env['WWW_GROUP']} ${homeDir}${path}`))
              .then(exec.bind(null,`/bin/chown ${process.env['WWW_UID']}:${process.env['WWW_GROUP']} ${homeDir}${path}.gzip`))
;
  
          }
        });
        console.log(stdout);
        return pr;
      })
      .catch((e)=>{console.log(`Error:${e}`);});
    }

}


// handler.on('push', function (event) {

// // githubからの更新を受け取る
//   console.log('プッシュイベントを受信:%s to %s',
//     event.payload.repository.name,
//     event.payload.ref);
//   // コンテンツの更新
//   if(event.payload.repository.name === 'www'){
//     exec('/usr/bin/git pull origin master --depth=1',opt)
//     .then((stdout,stderr)=>{
//       // git diffをとって変更のあったファイル一覧を取得する
//       var commitIDs = stdout.split(/\n/);
//       console.log(commitIDs);
//       return exec(`/usr/bin/git diff --name-only ${event.payload.after} ${event.payload.before}`,opt);    
//     })
//     .then((stdout,stderr)=>{
//       // 変更のあったファイルをgzip圧縮する
//       let files = stdout.split(/\n/);
//       let pr = Promise.resolve(0);
//       files.forEach((d,i)=>{
//         let path  = d.trim();
//         if(path.length > 0){          
//           pr = pr
//             .then(compressGzip.bind(null,homeDir + path))
//             .then(exec.bind(null,'/bin/chown sfpg:www-data ' + homeDir + path))
//             .then(exec.bind(null,'/bin/chown sfpg:www-data ' + homeDir + path + '.gz'));

//         }
//       });
//       console.log(stdout);
//       return pr;      
//     })
//     .catch((e)=>{console.log(`Error:${e}`);});
//   }
// });

// handler.on('issues', function (event) {
//   console.log('Received an issue event for %s action=%s: #%d %s',
//     event.payload.repository.name,
//     event.payload.action,
//     event.payload.issue.number,
    
//     event.payload.issue.title);
// });

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


