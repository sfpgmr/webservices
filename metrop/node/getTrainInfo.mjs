//
// 東京メトロ オープンデータ APIをいじるプログラム 
// Copyright (c) 2014 Satoshi Fujiwara
//
// このソースファイルはMITライセンスで提供します。
//
// The MIT License (MIT)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this 
// software and associated documentation files (the "Software"), to deal in the Software 
// without restriction, including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
// to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies 
// or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
// PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

//process.setuid && process.setuid('sfpg');

import fs from 'fs';
import MetroApi from './metroApi.mjs';
import util from 'util';

const outputDataDir = '../html/data';

const reg_type = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\?rdf\\:type\\=odpt\\:([^\\&]*)');
const reg_urn = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\/urn\\:ucode\\:([^\\&]*)');



(async () => {
  try {
    process.setuid && process.setuid(process.env['METROP_UID']);

    const api = await MetroApi.create();

    //
    
    (async () => {
      const path = outputDataDir + '/train.json';
      while (true) {
        const json = await api.callMetroAPI({ url: api.apiUrl + 'datapoints?rdf:type=odpt:Train' });
        await fs.promises.writeFile(path, JSON.stringify(json), 'utf-8');
        await api.compressGzip(path);
        let now = new Date();
        let interval = 60000;
        if (json[0]) {
          var dtv = new Date(json[0]['dct:valid']);
          var dt = new Date(json[0]['dc:date']);
          console.log(dtv - now);
          interval = dtv - now + 5000;
          if (interval < 0) {
            interval = 30000;
          }
          console.log(path + ':' + now.toLocaleString() + ':dct:valid:' + dtv.toLocaleString() + ':dc:date:' + dt.toLocaleString() + ':interval:' + interval);
        } else {
          console.log(path + ':error:' + console.log(json));
        }
        await api.wait(interval);
      }
    })();

    // 運行情報の保存

    (async () => {
      const path = outputDataDir + '/trainInfo.json';
      while (true) {
        const json = await api.callMetroAPI({ url: api.apiUrl + 'datapoints?rdf:type=odpt:TrainInformation' });
        await fs.promises.writeFile(path, JSON.stringify(json), 'utf-8');
        await api.compressGzip(path);
        let now = new Date();
        let interval = 60000;
        if (json[0]) {
          var dtv = new Date(json[0]['dct:valid']);
          var dt = new Date(json[0]['dc:date']);
          console.log(dtv - now);
          interval = dtv - now + 5000;
          if (interval < 0) {
            interval = 30000;
          }
          console.log(path + ':' + now.toLocaleString() + ':dct:valid:' + dtv.toLocaleString() + ':dc:date:' + dt.toLocaleString() + ':interval:' + interval);
        } else {
          console.log(path + ':error:' + console.log(json));
        }
        await api.wait(interval);
      }
    })();

    // GC

    (async () => {
      while (true) {
        const mem = process.memoryUsage();
        global.gc();
        console.log(new Date().toISOString() + ':ガベコレ:' + util.inspect(mem) + ':' + util.inspect(process.memoryUsage()));
        await api.wait(60000);
      }
    })();
  } catch (e) {
    console.log('Error:', e, e.stack);
    process.abort();
  }
})();

