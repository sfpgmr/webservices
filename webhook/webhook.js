"use strict";

const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const exec_ = require('child_process').exec;
const createHandler = require('github-webhook-handler');
const secret = fs.readFileSync('./secret','utf-8').trim();
const handler = createHandler({ path: '/', secret: secret});
const sockPath = '/tmp/webhook.sock';


// ソケットの削除
try {
  fs.unlinkSync(sockPath);
} catch(e) {

}

function denodeify(nodeFunc){
    var baseArgs = Array.prototype.slice.call(arguments, 1);
    return function() {
        var nodeArgs = baseArgs.concat(Array.prototype.slice.call(arguments));
        return new Promise((resolve, reject) => {
            nodeArgs.push((error, data) => {
                if (error) {
                    reject(error);
                } else if (arguments.length > 2) {
                    resolve(Array.prototype.slice.call(arguments, 1));
                } else {
                    resolve(data);
                }
            });
            nodeFunc.apply(null, nodeArgs);
        });
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

var exec = denodeify(exec_);

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404;
    res.end('no such location');
  })
}).listen(sockPath);

exec_('/bin/chown sfpg:www-data ' + sockPath);
   
handler.on('error', function (err) {
  console.error('Error:', err.message);
});

handler.on('push', function (event) {

// githubからの更新を受け取る
  console.log('プッシュイベントを受信:%s to %s',
    event.payload.repository.name,
    event.payload.ref);
  let homeDir = '/var/www/html/';
  let opt = {cwd:'/var/www/html'};
  // コンテンツの更新
  if(event.payload.repository.name === 'www'){
  	exec('/usr/bin/git pull origin master --depth=1',opt)
    .then((stdout,stderr)=>{
      // git diffをとって変更のあったファイル一覧を取得する
      var commitIDs = stdout.split(/\n/);
      console.log(commitIDs);
      return exec(`/usr/bin/git diff --name-only ${event.payload.after} ${event.payload.before}`,opt);    
    })
    .then((stdout,stderr)=>{
      // 変更のあったファイルをgzip圧縮する
      let files = stdout.split(/\n/);
      let pr = Promise.resolve(0);
      files.forEach((d,i)=>{
        let path  = d.trim();
        if(path.length > 0){          
          pr = pr
            .then(compressGzip.bind(null,homeDir + path))
            .then(exec.bind(null,'/bin/chown sfpg:www-data ' + homeDir + path))
            .then(exec.bind(null,'/bin/chown sfpg:www-data ' + homeDir + path + '.gz'));

        }
      });
      console.log(stdout);
      return pr;      
    })
    .then(()=>{
      //キャッシュの削除
      if(global.gc) {
        global.gc();
      }
    })
    .catch((e)=>{console.log(`Error:${e}`);});
  }
});

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title);
});

if(global.gc) {
  global.gc();
}
