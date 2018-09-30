'use strict';

//
// socket.ioによるインターネット・ハイスコア管理
// 2017/9/18 SSL対応実施
//

const sslKey = process.env.SOCKET_SSL_KEY;
const sslCert = process.env.SOCKET_SSL_CERT;
const socketPort = parseInt(process.env.SOCKET_PORT,10);
const fs = require('fs-extra');
const https = require('https');


async function webSocket(){
  const app = https.createServer({
    //  origins: ['*.sfpgmr.net:*','localhost:*'],
    key:await fs.readFile(sslKey,'utf-8'),
    cert:await fs.readFile(sslCert,'utf-8')
  });

  //app.listen(socketPort);
  const io = require('socket.io')(app,{
    origins: ['www.sfpgmr.net:*','blog.sfpgmr.net:*','alter.sfpgmr.net:*','io.sfpgmr.net:*','localhost:*'] 
  });
  // .listen(socketPort, {
  //   origins: ['*.sfpgmr.net:*','localhost:*'],
  //   //  key:await fs.readFile(sslKey,'utf-8'),
  //   //  cert:await fs.readFile(sslCert,'utf-8'),
  //   serveClient:true
  // });
  app.listen(socketPort);

  //io.set('log level', 3);

  const highScores = [];
  await readFile();

  var connectionCount = 0;

  const test = io.of('/test').on('connection', (socket) => {
    if (connectionCount >= 50) {
      socket.emit('errorConnectionMax', 0);
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

    socket.on('sendScore',  (score) => {
      if (!score.score || !score.name || isNaN(score.score)) {
        return;
      }

      if (highScores[0].score < score.score) {
        socket.broadcast.emit('sendHighScore', score);
        console.log('broadcast high score');
      }
      var i = 0;
      for (const end = highScores.length; i < end; ++i) {
        if (score.score > highScores[i].score) {
          for (var j = end - 1, je = i; j > je; --j) {
            highScores[j] = highScores[j - 1];
          }
          highScores[i] = { name: score.name, score: score.score };
          socket.emit('sendRank', { rank: i, highScores: highScores });
          break;
        }
      }

      if (i >= highScores.length) {
        socket.emit('sendRank', { rank: -1, highScores: highScores });
      }

      highScores.length = 10;
    }
    );
    socket.on('disconnect',  ()=> {
      connectionCount--;
      console.log(connectionCount);
    });
  });

  process.on('exit', async () => {
    await writeFile();
  });

  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGHUP', () => process.exit(0));

  async function readFile() {
    try {
      const data = JSON.parse(await fs.readFile('../data/hidden/score.json', 'utf-8'));
      highScores = data;
    } catch (e) {
      console.log(e);
      for (var i = 0; i < 10; ++i) {
        highScores.push({ name: '', score: 0 });
      }
    }
  }

  function writeFile() {
    return fs.writeFile('../data/hidden/score.json', JSON.stringify(highScores), 'utf-8');
  }
}

webSocket()
  .catch((e) => console.error(e, e.stack));
