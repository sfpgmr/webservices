"use strict";
const md = require('./md-to-html3');
// カレント作業ディレクトリの強制
process.chdir(require('path').resolve(__dirname,'../'));

(()=>{
  switch (process.argv[2]){
  case 'create':
    return md.create();
  case 'update':
    return md.update();
  case 'reset':
    return md.reset();
  case 'archiveTest':
    return md.archiveTest();
  }
})().catch(e=>{
  console.error(e,e.stack);
});

