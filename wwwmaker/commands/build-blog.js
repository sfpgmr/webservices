"use strict";
const md = require('./md-to-html3');
// カレント作業ディレクトリの強制
process.chdir(require('path').resolve(__dirname, '../'));

(async () => {
  try {
    switch (process.argv[2]) {
      case 'create':
        await md.create();
        break;
      case 'update':
        await md.update();
        break;
      case 'reset':
        await md.reset();
        break;
      case 'archiveTest':
        await md.archiveTest();
        break;
    }
  } catch (e) {
    console.error(e, e.stack);
  }
})();

