'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = _interopDefault(require('os'));
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var zlib = _interopDefault(require('zlib'));
var child_process = require('child_process');
var util = _interopDefault(require('util'));
var async = _interopDefault(require('async'));
require('http-errors');
var Koa = _interopDefault(require('koa'));
var serve = _interopDefault(require('koa-static'));
var Router = _interopDefault(require('koa-router'));
var mount = _interopDefault(require('koa-mount'));
var json = _interopDefault(require('koa-json'));
var logger = _interopDefault(require('koa-morgan'));
var bodyParser = _interopDefault(require('koa-bodyparser'));
var webhook = _interopDefault(require('koa-webhook'));
var helmet = _interopDefault(require('koa-helmet'));
var socket_io = _interopDefault(require('socket.io'));
var http2 = _interopDefault(require('http2'));
var http = _interopDefault(require('http'));

function resolveHome(filepath) {
    if (filepath[0] === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}

const queue = async.queue;

const exec = util.promisify(child_process.exec);
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

q.drain = () => {
  console.log('update content done');
};

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
function compressGzip(path$$1) {
  // gzipファイルを作成する
  return new Promise((resolve, reject) => {
    let out = fs.createWriteStream(path$$1 + '.gz');
    out.on('finish', resolve.bind(null));
  

    fs.createReadStream(path$$1)
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

const serveOpts = {extensions:['html','htm']};

//express.static.mime.types['wasm'] = 'application/wasm';

const app = new Koa();
const router = new Router();
app.use(helmet());
app.use(json());
app.use(bodyParser({jsonLimit:'10mb'}));
//app.use(xhub({algorithm: 'sha1', secret: fs.readFileSync(resolveHome('~/www/node/keys/webhook/secret'),'utf-8').trim()}));

app.use(logger('combined'));

//app.use(cookie());


app.use(async (ctx,next)=> {
  if (ctx.hostname == 'blog.sfpgmr.net') {
    ctx.status = 301;
    ctx.redirect('https://www.sfpgmr.net/blog' + ctx.url);
  } else {
  //ctx.set('Access-Control-Allow-Origin', '*');
  //ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  //ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  //ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  //ctx.set('SameSite','None');
  //ctx.set('Secure','');
  await next();
  }
});

app.use(mount('/metrop/',serve('../metrop/html',serveOpts)));
app.use(mount('/images/',serve(resolveHome('~/www/images/'),serveOpts)));
app.use(mount('/blog/',serve(resolveHome('~/www/blog/contents/'),serveOpts)));
app.use(mount('/content/',serve(resolveHome('~/www/images/content'),serveOpts)));

app.use(mount('/javascripts/',serve(resolveHome('~/www/node/webserver/public/javascripts/'),serveOpts)));
app.use(mount('/stylesheets/',serve(resolveHome('~/www/node/webserver/public/stylesheets/'),serveOpts)));
app.use(mount('/webhook/',webhook(fs.readFileSync(resolveHome('~/www/node/keys/webhook/secret'),'utf-8').trim()),webhookHandler()));
app.use(mount('/',serve(resolveHome('~/www/html/contents/'),serveOpts)));

class ScoreEntry {
  constructor(name, score){
    this.name = name;
    this.score = score;
  }
}

class ScoreServer {
  constructor(server,process){
    this.io = socket_io(server);
//    this.io.set('log level',1);
    this.io.path('/socket.io');

    this.server = server;
    this.process = process;
    this.highScores = [];
    this.connectionCount = 0;
    this.init();
  }

  async init(){
    await this.readFile();
    this.io.of('/test').on('connection',(socket)=>{
      if (this.connectionCount >= 50) {
        socket.emit('errorConnectionMax',0);
        socket.disconnect();
        return;
      }
      this.connectionCount++;
      console.log(this.connectionCount);

      socket.emit('sendHighScores', this.highScores);
      
      socket.on('getHighScores',  ()=> {
        socket.emit('sendHighScores', this.highScores);
      });

      socket.on('sendScore', (score)=> {
        if (!score.score || !score.name || isNaN(score.score)) {
          return;
        }
    
        if (this.highScores[0].score < score.score) {
          socket.broadcast.emit('sendHighScore', score);
          console.log('broadcast high score',score,this.highScores);
        }
        let i = 0;
        for (let end = this.highScores.length; i < end; ++i) {
          if (score.score > this.highScores[i].score) {
            for (var j = end - 1 ,je = i; j > je; --j) {
              this.highScores[j] = this.highScores[j - 1];
            }
            this.highScores[i] = score;
            socket.emit('sendRank', {rank:i,highScores:this.highScores});
            break;
          }
        }
    
        if (i >= this.highScores.length) {
          socket.emit('sendRank', {rank:-1,highScores:this.highScores});
        }
        this.highScores.length = 10;
      }
      );

      socket.on('disconnect', function () {
        this.connectionCount--;
        console.log(this.connectionCount);
      });

    });

    this.process.on('exit', ()=> {
      console.log('exit');
      this.writeFile();
    });
    
    this.process.on('SIGINT', ()=>{
      console.log('SIGINT');
      this.process.exit(0);
    });

    
    this.process.on('SIGTERM', ()=> {
      console.log('SIGTERM');
      this.process.exit(0);
    });
    
    this.process.on('SIGHUP', ()=> {
      console.log('SIGHUPT');
      this.process.exit(0);
    });

    
  }

  async readFile() {
    try{
      this.highScores = JSON.parse(await fs.promises.readFile(resolveHome('~/www/node/webserver/score.json'), 'utf-8'));
    } catch (e) {
      console.log(e);
      this.highScores = [];
      for (var i = 0; i < 10; ++i) {
        this.highScores.push(new ScoreEntry('',0));
      }
    }
  }
  
  writeFile() {
    console.log('writeFile');
    fs.writeFileSync(resolveHome('~/www/node/webserver/score.json'), JSON.stringify(this.highScores), 'utf-8');
  }  
}



// var highScores = [];
// readFile();

// var connectionCount = 0;
//server.listen(/*process.env.PORT || */ 8081);

//app.get('/', function (req, res) {
//  res.sendfile(__dirname + '/index.html');
//});

/*
var test = io.of('/test').on('connection', function (socket) {
  if (connectionCount >= 50) {
    socket.emit('errorConnectionMax',0);
    socket.disconnect();
    return;
  }
  connectionCount++;
  console.log(connectionCount);
  socket.emit('sendHighScores', highScores);
  socket.on('getHighScores', function () {
    socket.emit('sendHighScores', highScores);
    console.log(data);
  });
  socket.on('sendScore', function (score) {
    if (!score.score || !score.name || isNaN(score.score)) {
      return;
    }

    if (highScores[0].score < score.score) {
      socket.broadcast.emit('sendHighScore', score);
      console.log('broadcast high score');
    }
    var i = 0;
    for (var end = highScores.length; i < end; ++i) {
      if (score.score > highScores[i].score) {
        for (var j = end - 1 ,je = i; j > je; --j) {
          highScores[j] = highScores[j - 1];
        }
        highScores[i] = score;
        socket.emit('sendRank', {rank:i,highScores:highScores});
        break;
      }
    }

    if (i >= highScores.length) {
      socket.emit('sendRank', {rank:-1,highScores:highScores});
    }

    highScores.length = 10;
  }
  );
  socket.on('disconnect', function () {
    connectionCount--;
    console.log(connectionCount);
  });
});

process.on('exit', function () {
  writeFile();
});

process.on('SIGINT', function () {
  process.exit(0);
});

process.on('SIGTERM', function () {
  process.exit(0);
});

process.on('SIGHUP', function () {
  process.exit(0);
});
*/

/**
 * Module dependencies.
 */

//const app = new Koa();
// app.use(ctx => {
//   ctx.body = 'Hello Koa';
// });
const keys = JSON.parse(fs.readFileSync(resolveHome('~/www/node/keys/webserver/keys.json')));


/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '443');
//app.
//app.set('port', port);
const httpPort = normalizePort(process.env.HTTP_PORT || '80');

/**
 * Create HTTP server.
 */

const options = {
  key:fs.readFileSync(resolveHome(keys.key)),
  cert:fs.readFileSync(resolveHome(keys.cert)),
  allowHTTP1: true
};


keys.passphrase && (options.passphrase = keys.passphrase);

const server = http2.createSecureServer(options,app.callback());
const scoreSever = new ScoreServer(server,process);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() 
{
  console.log(process.env['WWW_UID']);
  process.setuid && process.setuid(process.env['WWW_UID']);
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
   console.debug('Listening on ' + bind);
}

// Redirect from http port 80 to https
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(httpPort);
