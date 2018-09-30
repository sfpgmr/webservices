'use strict';
const crypto = require('crypto');
const md5sum = crypto.createHash('md5');
const md5sum1 = crypto.createHash('md5');

console.log(md5sum.update('testああああ','utf8').digest('hex'));

console.log(md5sum1.update('testああああ1','utf8').digest('hex'));



