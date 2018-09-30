import fs from 'fs';

const file = fs.readFileSync('./test.mjs','utf-8');
console.log(file);
