var fs = require('fs');
var crypto = require('crypto');
var cipher = crypto.createCipher('aes-256-cbc', 'sfpgmr@enoie.net');
var file = fs.readFileSync('YouTubeApp.json', 'utf-8');
var crypted = cipher.update(file, 'utf-8', 'hex');
crypted += cipher.final('hex');
fs.writeFileSync('h:/pj/www/html/keys/YouTubeApp.json', crypted, 'utf-8');
console.log(crypted);


