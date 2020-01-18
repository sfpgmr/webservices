import fs from 'fs-extra';
import util from 'util';
import child_process from 'child_process';
const exec = util.promisify(child_process.exec);
import blogConfig from './config-blog';

//const rootDir = '../' + blogConfig.contentRoot;
const rootDir = blogConfig.destEjsDir;

async function gzContents() {
  // ファイル一覧を作成
  let filePaths = [];
  async function listFile(mdDir) {
    // .mdディレクトリを再帰的に検索する
    let dirs = await fs.readdir(mdDir);
    for (const d of dirs){
      let mdPath = mdDir + d;
      let stats = await fs.stat(mdPath);
      if (stats.isDirectory()) {
        await listFile(mdPath + '/');
      } else if (stats.isFile() && !d.match(/\.gz$/)) {
        console.log(mdDir + d);
        await exec(`/bin/gzip -9 -c ${mdDir + d} > ${ mdDir + d}.gz`);
      }
    }
  }
  await listFile(rootDir);
}

gzContents();
