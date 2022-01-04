import socket_io from 'socket.io';
import resolveHome from '../resolveHome.mjs';
//.listen(8081, {
  //   origins:['www.enoie.net:*','github.sfpgmr.net:*','www.sfpgmr.net:*'/*,'localhost:*'*/]
  // })
import fs from 'fs';

class ScoreEntry {
  constructor(name, score){
    this.name = name;
    this.score = score;
  }
}

export default class ScoreServer {
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



