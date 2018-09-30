"use strict";

const fs = require('fs');
const zlib = require('zlib');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const spawn_ = require('child_process').spawn;
const blogConfig = require('./config-blog');
const path = require('path');
const unlink = util.promisify(fs.unlink);

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

// コンテンツを更新して、.gzファイルを作成する
async function getRemote(event) {

  let files = [];

  let homeDir = '/var/www/html/contents';
  let contentRoot = blogConfig.contentRoot;
  let opt = { cwd: '/var/www/html' };
  // コンテンツの更新
  // コンテンツのリモートレポジトリとの差分情報を取得
  await exec('/usr/bin/git fetch origin --depth 1 --quiet', opt);
  const f = await spawn('/usr/bin/git', ['--no-pager', 'diff', 'HEAD..origin/master', '-C', '-M', '--name-status', `--relative=${contentRoot}`], opt);
  files = f.split(/\n/g)
    .map(d => {
      let da = d.split(/\t/g);
      return { status: da[0], path: `${da[1]}` };
    })
    .filter(d => d.status != '' && (!d.path.match(/\.gz$/)));
  await exec('/usr/bin/git reset --quiet --hard origin/master ');

  let added = false;

  for (const d of files) {
    console.log(d.status, d.path);
    switch (d.status) {
    case 'A':
      {
        // 追加・修正されたファイルの.gzファイルを作り直す
        let p = path.normalize(homeDir + '/' + d.path);
        try {
          await exec(`/bin/gzip -9 -c ${p} > ${p}.gz `);
          await exec(`/bin/chown sfpg:www-data ${p}`);
          await exec(`/bin/chown sfpg:www-data ${p}.gz`);
        } catch (e) {
          if (e.code != 'ENOENT') throw e;
        }
      }
      if(d.path.match(/.html?/i)){
        added = true;
      }
      break;
    case 'M':
      // 追加・修正されたファイルの.gzファイルを作り直す
      let p = path.normalize(homeDir + '/' + d.path);
      try {
        await exec(`/bin/gzip -9 -c ${p} > ${p}.gz `);
        await exec(`/bin/chown sfpg:www-data ${p}`);
        await exec(`/bin/chown sfpg:www-data ${p}.gz`);
      } catch (e) {
        if (e.code != 'ENOENT') throw e;
      }
      break;
    case 'D':
      // 削除ファイルの.gzファイルを削除する
      let dp = path.normalize(homeDir + d.path + '.gz');
      try {
        await unlink(dp);
      } catch (e) {
        if (e.code != 'ENOENT') throw e;
      }
      break;
    }
  }

  try {
    await exec('/usr/bin/git gc --quiet');
    await exec('/usr/bin/git prune');
  } catch (e) {
    console.error(e);
  }
  return added;
}

module.exports = getRemote;