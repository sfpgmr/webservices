/**
 * Module dependencies.
 */
 
import app from '../app.mjs';
import ScoreServer from './ScoreServer.mjs';
//import {debug as debug_} from 'debug';
//debug = debug_('webserver:server');
import http2 from 'spdy';
//import http2 from 'http2';
import http from 'http';
import fs from 'fs';
import resolveHome from '../resolveHome.mjs';

const keys = JSON.parse(fs.readFileSync(resolveHome('~/www/webservices/keys/webserver/keys.json')));


/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '443');
app.set('port', port);
const httpPort = normalizePort(process.env.HTTP_PORT || '80');

/**
 * Create HTTP server.
 */

const options = {
  key:fs.readFileSync(resolveHome(keys.key)),
  cert:fs.readFileSync(resolveHome(keys.cert))
};

keys.passphrase && (options.passphrase = keys.passphrase);

const server = http2.createServer(options,app);
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
  //debug('Listening on ' + bind);
}

// Redirect from http port 80 to https
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(httpPort);
