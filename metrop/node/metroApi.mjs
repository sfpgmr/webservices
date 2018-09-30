"use strict";
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

import fs_ from 'fs';
const fs = fs_.promises;
import https from 'https';
import http from 'http';
import zlib from 'zlib';


const cacheDir = './data';

//var reg = new RegExp('.*\\/v2\\/([^\\/\\?]*)(.*)$');

export default class MetroApi {
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
        let retry = 10;
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


