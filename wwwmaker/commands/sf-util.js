'use strict';

const fs = require('fs-extra');
const util = require('util');
const exec_ = require('child_process').exec;
const spawn_ = require('child_process').spawn;
const zlib = require('zlib');

const exec = util.promisify(exec_);

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


function spawn(command, args, options) {
  return new Promise((resolve, reject) => {
    let out = '';
    let errOut = '';
    let s = spawn_(command, args, options);
    s.stdout.on('data', data => {
      out += data;
    });
    s.stderr.on('data', err => {
      errOut += err;
      //console.log('message:',err.toString());
      //reject(new Error(err));
    });
    s.on('close', () => {
      resolve(out, errOut);
    });
  });
}

// DateをISO8601形式文字列に変換する
// String.toISOString()はタイムゾーンがZとなってしまうので。。
function pad(n) {
  return ('0' + n).slice(-2);
}

function toISOString(d = new Date()) {
  const timezoneOffset = d.getTimezoneOffset();
  const hour = Math.abs(timezoneOffset / 60) | 0;
  const minutes = Math.abs(timezoneOffset % 60);
  let tzstr = 'Z';
  if (timezoneOffset < 0) {
    tzstr = `+${pad(hour)}:${pad(minutes)}`;
  } else if (timezoneOffset > 0) {
    tzstr = `-${pad(hour)}:${pad(minutes)}`;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${tzstr}`;
}

// ISO8601形式かどうかをチェックする正規表現
var ISO8601Format = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)$/;


function parseAttributes(attrbStr){
  let p = attrbStr.trim().split(/\s/g);
  let attribs = {};
  for(let i = 0,e = p.length;i < e;++i){
    let attrib =p[i].split(/=/);
    
    attrib[0] = attrib[0].trim().toLowerCase();
    attrib[1] = (attrib[1] && attrib[1].trim().replace(/^['"]?([^`"]*)['"]?$/,'$1')) || '';
    if(attrib[0].length > 0){
      attribs[attrib[0]] = attrib[1];
    }
  }
  return attribs;
}

module.exports = {
  exec:exec,
  spawn:spawn,
  compressGzip:compressGzip,
  toISOString:toISOString,
  ISO8601Format:ISO8601Format,
  parseAttributes:parseAttributes
};

