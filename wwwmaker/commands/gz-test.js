"use strict";

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const spawn_ = require('child_process').spawn;

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
    })
  });
}

exec('gzip -9 -c ./out.txt > out.txt.gz')
.catch(e=>console.log(e,e.stack));
