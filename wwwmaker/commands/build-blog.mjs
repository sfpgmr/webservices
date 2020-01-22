import * as md from './md-to-html3.mjs';
import path from 'path';

// カレント作業ディレクトリの強制
process.chdir(path.resolve(path.dirname(new URL(import.meta.url).pathname),'../'));


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
      default:
        await md.update();
        break;
    }
  } catch (e) {
    console.error(e, e.stack);
  }
})();

