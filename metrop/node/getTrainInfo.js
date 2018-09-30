'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs_ = _interopDefault(require('fs'));
var https = _interopDefault(require('https'));
var http = _interopDefault(require('http'));
var zlib = _interopDefault(require('zlib'));
var util = _interopDefault(require('util'));

const fs = fs_.promises;


const cacheDir = './data';

//var reg = new RegExp('.*\\/v2\\/([^\\/\\?]*)(.*)$');

class MetroApi {
    constructor() {
        this.apiUrl =  'https://api.tokyometroapp.jp/api/v2/';
    }

    async init(keysPath = '../../keys/metrop/apikey.json') {
        
        const key = await fs.readFile(keysPath, 'utf-8');
        this.timestamp = (new Date()).getTime();
        // マスタ的な情報をまずまとめて取得する。
        this.keys = JSON.parse(key);
        //this.apiKey = keys.apiKey;
        //this.googleApiKey = keys.googleCalender;
    }

    // 東京MetroAPIの呼び出し
    async callMetroAPI(opts) {
        for(let i = 0; i < 10;++i){
            try {
                let json = await this.callMetroAPI_(opts);
                json = JSON.parse(json);
                return json;
            } catch (e) {
    
            }
        }

        throw new Error('API呼び出しのRetry上限を超えました。');

    }

    async callMetroAPI_(url) {
        const tmsec = (new Date()).getTime() - this.timestamp;
        const this_ = this;
        if(tmsec < 100){
            await this.wait(tmsec);
        }
        return new Promise((resolve, reject) => {
            let consumerKey =   url.url.match(/\?/) ? '&acl:consumerKey=' + this.keys.apiKey : '?acl:consumerKey=' + this.keys.apiKey;
            https.get(url.url + consumerKey, (res) => {
                let body = '';
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function (res) {
                    //            ret = JSON.parse(body);
                    this_.timestamp = (new Date()).getTime();
                    resolve(body);
                });
            }).on('error', function (e) {
                console.log(e);
                reject(e);
            });
        });
    }

    httpGet(url) {

        return new Promise((resolve, reject) => {
            http.get(url, function (res) {
                var body = '';
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function (res) {
                    resolve(body);
                });
            }).on('error', function (e) {
                console.log(e);
                reject(e);
            });
        });
    }

    httpsGet(url) {
        return new Promise((resolve, reject) => {
            https.get(url, function (res) {
                var body = '';
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function (res) {
                    resolve(body);
                });
            }).on('error', function (e) {
                console.log(e);
                reject(e);
            });

        });
    }

    // ローカルキャッシュ付きのAPI呼び出し
    async callMetroAPICached(opts) {
        const s = opts.cacheregex.exec(opts.url);
        const dir = cacheDir + '/' + s[1];
        const path = (dir + '/' + encodeURIComponent(s[2]) + '.json');
        const this_  = this;
        console.log(path);

        async function callApi(){
            let json;
            let retry = 10;
            while(retry){
                try {
                    json = JSON.parse(await this_.callMetroAPI_(opts));
                    break;
                } catch (e) {
                    console.log(e,e.stack);
                    await this_.wait(150);
                    --retry;
                    continue;
                }
            }

            if(!retry) throw new Error('API呼び出しのRetry上限を超えました。');
            
            try {
                await fs.mkdir(dir);
            } catch (err) {
                // ディレクトリ作成失敗
                if (err.code !== 'EEXIST') {
                    throw err;
                }
            }
            await fs.writeFile(path, JSON.stringify(json), 'utf-8');
            return json;
        }

        if(opts.cache){
            // まずキャッシュファイルの返却を試みる
            try {
                const json = await fs.readFile(path, 'utf-8');
                return JSON.parse(json);
            } catch (e) {
                return callApi();
            }
        } else {
            return callApi();
        }
    }
    
    compressGzip(path) {
        return new Promise((resolve, reject) => {
            // gzipファイルを作成する
            const out = fs_.createWriteStream(path + '.gz');
            out.on('finish', resolve);
            out.on('error', reject);
            fs_.createReadStream(path)
                .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
                .pipe(out);
        });
    }
    
    callAPIAndSaveFileGzipped(apiUrl) {
        return this.callMetroAPI({ url: apiUrl })
            .then(function (json) {
                return fs.writeFile(path, json, 'utf-8');
            })
            .then(this.compressGzip.bind(this, path));
    }    

    wait(msec = 125){
        return new Promise((resolve,reject)=>{
            setTimeout(resolve,msec);
        });
    }
    static async create() {
        const api = new MetroApi();
        await api.init();
        return api;
    }
}

//

const outputDataDir = '../html/data';



(async () => {
  try {
    process.setuid && process.setuid(process.env['METROP_UID']);

    const api = await MetroApi.create();

    //
    
    (async () => {
      const path = outputDataDir + '/train.json';
      while (true) {
        const json = await api.callMetroAPI({ url: api.apiUrl + 'datapoints?rdf:type=odpt:Train' });
        await fs_.promises.writeFile(path, JSON.stringify(json), 'utf-8');
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
        await fs_.promises.writeFile(path, JSON.stringify(json), 'utf-8');
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
