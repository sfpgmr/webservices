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
import MetroApi from './metroApi.mjs';
const outputDataDir = '../html/data';

const reg_type = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\?rdf\\:type\\=odpt\\:([^\\&]*)');
const reg_urn = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\/urn\\:ucode\\:([^\\&]*)');

//var reg = new RegExp('.*\\/v2\\/([^\\/\\?]*)(.*)$');
const stationGeoJsons = {};
let template = null;
let railways = null;
let stations = null;
let cache = false;

// 各線の色情報
const lineInfos = {
    '4号線丸ノ内線分岐線': { color: '#e60012', 'owl:sameAs': 'odpt.Railway:TokyoMetro.MarunouchiBranch', direction: 'odpt.RailDirection:TokyoMetro.NakanoSakaue' },
    '4号線丸ノ内線': { color: '#e60012', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Marunouchi', direction: 'odpt.RailDirection:TokyoMetro.Ikebukuro' },
    '3号線銀座線': { color: '#f39700', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Ginza', direction: 'odpt.RailDirection:TokyoMetro.Asakusa' },
    '11号線半蔵門線': { color: '#9b7cb6', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Hanzomon', direction: 'odpt.RailDirection:TokyoMetro.Oshiage' },
    '5号線東西線': { color: '#00a7db', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Tozai', direction: 'odpt.RailDirection:TokyoMetro.NishiFunabashi' },
    '2号線日比谷線': { color: '#9caeb7', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Hibiya', direction: 'odpt.RailDirection:TokyoMetro.KitaSenju' },
    '7号線南北線': { color: '#00ada9', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Namboku', direction: 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi' },
    '13号線副都心線': { color: '#bb641d', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Fukutoshin', direction: 'odpt.RailDirection:TokyoMetro.Shibuya' },
    '8号線有楽町線': { color: '#d7c447', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Yurakucho', direction: 'odpt.RailDirection:TokyoMetro.ShinKiba' },
    '9号線千代田線': { color: '#009944', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Chiyoda', direction: 'odpt.RailDirection:TokyoMetro.Ayase' },
};

// 各線の情報
const railwayInfos = {
    'odpt.Railway:TokyoMetro.MarunouchiBranch': { direction: 'odpt.RailDirection:TokyoMetro.NakanoSakaue' },
    'odpt.Railway:TokyoMetro.Marunouchi': { direction: 'odpt.RailDirection:TokyoMetro.Ikebukuro' },
    'odpt.Railway:TokyoMetro.Ginza': { direction: 'odpt.RailDirection:TokyoMetro.Asakusa' },
    'odpt.Railway:TokyoMetro.Hanzomon': { direction: 'odpt.RailDirection:TokyoMetro.Oshiage' },
    'odpt.Railway:TokyoMetro.Tozai': { direction: 'odpt.RailDirection:TokyoMetro.NishiFunabashi' },
    'odpt.Railway:TokyoMetro.Hibiya': { direction: 'odpt.RailDirection:TokyoMetro.KitaSenju' },
    'odpt.Railway:TokyoMetro.Namboku': { direction: 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi' },
    'odpt.Railway:TokyoMetro.Fukutoshin': { direction: 'odpt.RailDirection:TokyoMetro.Wakoshi' },
    'odpt.Railway:TokyoMetro.Yurakucho': { direction: 'odpt.RailDirection:TokyoMetro.Wakoshi' },
    'odpt.Railway:TokyoMetro.Chiyoda': { direction: 'odpt.RailDirection:TokyoMetro.Ayase' }
};



(async () => {

    try {

        const api = await MetroApi.create();
        //const promises = [];
        const d = [];
    
        {
            const urls = [
                { url: api.apiUrl + 'datapoints?rdf:type=odpt:Railway', cacheregex: reg_type, cache: cache },
                { url: api.apiUrl + 'datapoints?rdf:type=odpt:Station', cacheregex: reg_type, cache: cache }
            ];


            for(let i = 0,ei = urls.length;i < ei;++i){
                const url = urls[i];
                let json = await api.callMetroAPICached(url);
                d.push(json);
            }
   
        }

        //const d = //await Promise.all(promises);
        //process.exit(0);

    
        // 路線描画 geoJsonデータの取得
        railways = d[0];
        stations = d[1];
        let retry = 10;
        // 駅位置データ取得
        for(let i = 0,ei = stations.length;i < ei;++i){
            const st = stations[i];
            const json = await api.callMetroAPICached({ url: st['ug:region'], cacheregex: reg_urn, cache: cache });
            st['ug:region'] = json;
            stationGeoJsons[st['dc:title']] = { stationData: st, geometry: json };
        }
    
        {
            console.log('その他情報の保存');
            //// 運行情報の保存
            //[   { 'apiUrl' : apiUrl + 'datapoints?rdf:type=odpt:TrainInformation', 'path' : outputDataDir + '/trainInfo.json', 'apiKey' : apiKey },
            //    { 'apiUrl' : apiUrl + 'datapoints?rdf:type=odpt:Train', 'path' : outputDataDir + '/train.json', 'apiKey' : apiKey }
            //]
            //.forEach(function (d) {
            //    promises.push(callAPIAndSaveFileGzipped(d.apiUrl, d.path, d.apiKey));
            //});
    
            // その他情報の保存

            try {
                await fs.mkdir(outputDataDir);
            } catch (e){
                if (e.code !== 'EEXIST') {
                    throw e;
                }
            }

            const etc = [
                { url: api.apiUrl + 'datapoints?rdf:type=odpt:StationFacility', cacheregex: reg_type, path: outputDataDir + '/stationFacility.json',cache:cache },
                { url: api.apiUrl + 'datapoints?rdf:type=odpt:PassengerSurvey', cacheregex: reg_type, path: outputDataDir + '/passengerSurvey.json',cache:cache },
                { url: api.apiUrl + 'datapoints?rdf:type=odpt:RailwayFare', cacheregex: reg_type, path: outputDataDir + '/railwayFare.json',cache:cache }//,
            ];

            for(let i = 0,ei = etc.length;i < ei;++i){
                const url = etc[i];
                const json = await api.callMetroAPICached(url);
                await fs.writeFile(url.path,JSON.stringify(json),'utf-8');
                await api.compressGzip(url.path);
            }
    
            
    
            // 駅時刻表は駅ごとに分割して保存する
            {
                console.log('駅時刻表の保存');
                try {
                    await fs.mkdir(outputDataDir + '/stationTimeTable/');
                } catch (e) {
                    if (e.code !== 'EEXIST') {
                        throw e;
                    }
                }

                const tbls = await api.callMetroAPICached({ url: api.apiUrl + 'datapoints?rdf:type=odpt:StationTimetable', cacheregex: reg_type,cache:true });
                const stationTimeTableIndexs = {};

                for(let i = 0,ei = tbls.length;i < ei;++i){
                    const d = tbls[i];
                    const fname = d["owl:sameAs"].split(':')[1] + '.json';
                    const fp = outputDataDir + '/stationTimeTable/' + fname;
                    if (!stationTimeTableIndexs[d['odpt:station']]) {
                        stationTimeTableIndexs[d['odpt:station']] = [];
                    }
                    stationTimeTableIndexs[d['odpt:station']].push({ direction: d['odpt:railDirection'], path: '/metrop/data/stationTimeTable/' + fname });
                    
                    await fs.writeFile(fp,JSON.stringify(d),'utf-8');
                    await api.compressGzip(fp);

                }


                await fs.writeFile(outputDataDir + '/stationTimeTable/stationTimeTableIndexs.json', JSON.stringify(stationTimeTableIndexs), 'utf-8');

            }
    
            // 列車時刻表は列車ごとに分割して保存する
            {
                console.log('列車時刻表');

                try {
                    await fs.mkdir(outputDataDir + '/trainTimeTable/');
                } catch (e) {
                    if (e.code !== 'EEXIST') {
                        throw e;
                    }
                }

                

                const tbls = await api.callMetroAPICached({ url : api.apiUrl + 'datapoints?rdf:type=odpt:TrainTimetable', cacheregex : reg_type,cache:cache });
                for(let i = 0,ei = tbls.length;i < ei;++i){
                    const d = tbls[i];
                    const fname = d["owl:sameAs"].split(':')[1] + '.json';
                    const fp = outputDataDir + '/trainTimeTable/' + fname;
                    await fs.writeFile(fp, JSON.stringify(d), 'utf-8');
                    await api.compressGzip(fp);
                 }


            }

            const stationDataPath = outputDataDir + '/stations.json';
            await fs.writeFile(stationDataPath, JSON.stringify(stations), 'utf-8');
            await api.compressGzip(stationDataPath);
    
            const railwaysDataPath = outputDataDir + '/railways.json';
            await fs.writeFile(railwaysDataPath, JSON.stringify(railways), 'utf-8');
            await api.compressGzip(railwaysDataPath);

   
        }
    
        {
            // 3年分の休日データを取得
            let url = `https://www.googleapis.com/calendar/v3/calendars/japanese__ja@holiday.calendar.google.com/events?key=${api.keys.googleCalender}&maxResults=100`;
            //return httpsGet('https://www.google.com/calendar/feeds/ja.japanese%23holiday%40group.v.calendar.google.com/public/full?alt=json&max-results=100')
            await api.httpsGet(url)
                .then((json) => {
                    return fs.writeFile(outputDataDir + '/holidays.json', json, 'utf-8')
                })
                .then(api.compressGzip.bind(api, outputDataDir + '/holidays.json'));        
    
        }
    
        console.log('### 処理終了 ###');
    
    } catch(err){
        console.log('Error:',err,err.stack);
        process.abort();
    }
})();
