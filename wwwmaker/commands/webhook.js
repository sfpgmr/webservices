'use strict';

const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const spawn_ = require('child_process').spawn;
const createHandler = require('github-webhook-handler');
const secret = fs.readFileSync('./data/hidden/secret', 'utf-8').trim();
const handler = createHandler({ path: '/', secret: secret });
const sockPath = '/tmp/webhook.sock';
const getRemote = require('./getRemote');
const blogPing = require('./blogPing');

let pushEvents = [];

function spawn(command, args, options) {
  return new Promise((resolve, reject) => {
    let out = '';
    let s = spawn_(command, args, options);
    s.stdout.on('data', (data) => {
      out += data;
    });
    s.stderr.on('data', err => {
      reject(new Error(err));
    });
    s.on('close', () => {
      resolve(out);
    });
  });
}

// ソケットの削除
try {
  fs.unlinkSync(sockPath);
} catch (e) {

}

function compressGzip(path) {
  // gzipファイルを作成する
  return new Promise((resolve, reject) => {
    var out = fs.createWriteStream(path + '.gz');
    out.on('finish', resolve.bind(null));

    fs.createReadStream(path)
      .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
      .pipe(out);
    out = void (0);
  });
}

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(sockPath);


exec('/bin/chown sfpg:www-data ' + sockPath);

handler.on('error', function (err) {
  console.error('Error:', err.message);
});

handler.on('push', function (event) {
  // githubからの更新を受け取る
  console.log('プッシュイベントを受信:%s to %s',
    event.payload.repository.name,
    event.payload.ref);

  let homeDir = '/var/www/html/';
  let opt = { cwd: '/var/www/html' };
  // コンテンツの更新
  if (event.payload.repository.name === 'www') {
    console.log('push event');
    pushEvents.push(true);
  }
});

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title);
});

const timeOut = 60 /* sec */ * 1000 ;
function updateContents(){
  if(pushEvents.length > 0){
    console.log('updateContent');
    pushEvents.shift();
    getRemote()
      .then((added)=>{
        if(added){
          blogPing();
        }        
      })
      .then(()=>{
        if (global.gc) {
          global.gc();
        }
        console.log('complete');
        setTimeout(updateContents,timeOut);
      })
      .catch(e=>{
        console.error(e);
        setTimeout(updateContents,timeOut);
      });
  } else {
    setTimeout(updateContents,timeOut );
  }
}
updateContents();
