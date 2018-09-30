var //app = require('express')()
  //, server = require('http').createServer(app)
  /*,*/ io = require('socket.io').listen(8081, {
    origins:['www.enoie.net:*','github.sfpgmr.net:*','www.sfpgmr.net:*'/*,'localhost:*'*/]
  })
  , fs = require('fs');
io.set('log level',1);


function ScoreEntry(name, score) {
  this.name = name;
  this.score = score;
}

var highScores = [];
readFile();

var connectionCount = 0;
//server.listen(/*process.env.PORT || */ 8081);

//app.get('/', function (req, res) {
//  res.sendfile(__dirname + '/index.html');
//});

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

function readFile() {
  try{
    var data = JSON.parse(fs.readFileSync(__dirname + '/score.txt', 'utf-8'));
    highScores = data;
  } catch (e) {
    console.log(e);
    for (var i = 0; i < 10; ++i) {
      highScores.push(new ScoreEntry('',0));
    }
  }
}

function writeFile() {
  fs.writeFileSync(__dirname + '/score.txt', JSON.stringify(highScores), 'utf-8');
}


