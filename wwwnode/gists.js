//
// Youtube API サンプルを生成する
//
//The MIT License(MIT)
//Copyright(c) 2014  Satoshi Fujiwara
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files(the "Software"), to deal 
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject tothe following conditions:
//
//    The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

var util = require('util');
var https = require('https');
var fs = require('fs');
var d3 = require('d3');
var q = require('q');
var ect = require('ect');

var readFile = q.nfbind(fs.readFile);
var writeFile = q.nfbind(fs.writeFile);

//var jsonld = {
//  "@context" : {
//    "name" : {
//      "@id": "http://schema.org/name", 
//      "@type" : "WebSite",
//    "description": "http://schema.org/description"
//  },
//  "@type" : "WebSite",
//  "name " : "S.F. Page",
//  "about" : "Satoshi Fujiwaraのページ",
//  "author": {
//    "@type": "Person",
//    "name": "Satoshi Fujiwara",
//    "url": "http://www.enoie.net/"
//  },
//  "editor" : {
//    "@type": "Person",
//    "name": "Satoshi Fujiwara",
//    "url": "http://www.enoie.net/"
//  },
//  "dateCreated" : "1996-01-01",
//  "dateModified" : "",
//  "datePublished" : "",
//  "encoding" : "utf-8",
//  "keywords" : "Internet,Java Script,C++,Computer,Music ",
//  "genre":"Computer Science,Computer Programming,Computer Music",  
//  "url" : "http://www.enoie.net/"
//};

var contents = {
  "@context" : {
    "@vocab" : "http://schema.org",
    "@language" : "ja",
    "children" : "http://schema.org/WebPage"
    },
  "@id" : "http://www.enoie.net/",
  "@type" : "WebSite",
  "name " : "S.F. Page",
  "about" : "Satoshi Fujiwaraのページ",
  "children" : [
    {
      "name" : "ブログ",
      "description" : "はてなブログコンテンツです。毎日の成果・出来事を書いています。",
      "url" : "http://sfpgmr.hatenablog.jp/"
    },
    {
      "name": "HTML5実験"
    }
]
}

q.all([readFile('apikey.json', 'utf-8'), readFile('config.json', 'utf-8')])
.spread(function (keys, config) {
    keys = JSON.parse(keys);
    config = JSON.parse(config);
    var json = q.nfbind(d3.json);
  
    var result = [];
    var defer = q.defer();
    function getData(pageToken) {
      var pt = '';
      if (pageToken) {
        pt = '&pageToken=' + pageToken;
      }
      callYoutubeAPI('https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCgwM0kBBsDRMZDhhWuTNR-g&order=date&maxResults=50' + pt + '&key=' + keys.youtube)
      .then(function (d) {
        var dt = JSON.parse(d);
        result = result.concat(dt.items);
        if (d.nextPageToken) {
          getData(d.nextPageToken);
        } else {
          defer.resolve();
        }
      });
    }
    getData();
  
    defer.promise.then(function () {
      var thumb = d3.select('body').selectAll('div')
              .data(result)
              .enter()
              .append('div')
              .classed({ 'col-xs-12': true, 'col-md-4': true, 'col-lg-3': true })
              .append('div')
              .classed('thumbnail', true)
              .style('height', '400px')
              .style('overflow', 'auto');
    
    
      thumb.append('a')
                  .attr('href', function (d) { return 'https://www.youtube.com/watch?v=' + d.id.videoId; })
                  .attr('target', '_blank')
              .append('img')
              .attr('src', function (d) { return d.snippet.thumbnails.high.url; })
              .attr('alt', function (d) { return d.snippet.title; });
      var cap = thumb
              .append('div')
              .classed('caption', true);
    
      cap.append('h4').text(function (d) { return d.snippet.title; });
      cap.append('p').text(function (d) { return d.snippet.description; });
    var renderer = ect({ root : './' });
    var now = new Date();
      var data = {
        title : 'Youtube Test 0001 - 動画をサムネイルする',
        description: 'Youtube Test 0001 - 動画をサムネイルする',
        keywords : 'Youtube,d3.js',
        author: 'sfpgmr',
      articleBody: d3.select('body').html(),
        datetime:now.toISOString(),
        datestr:now.toISOString()
    };
    console.log(d3.select('body').html());
      return writeFile(config.contentRoot + '/test/Youtube/0001' + '/index.html', renderer.render('template_yt0001.html', data), 'utf-8');
  });
  return defer.promise;    
})
.catch(function (e) {
    console.log(e);
})
.done(function () {
  console.log('処理終了');
})
;

function callYoutubeAPI(url) {
  
  var d = q.defer();
  https.get(url, function (res) {
    var body = '';
    res.setEncoding('utf8');
    
    res.on('data', function (chunk) {
      body += chunk;
    });
    
    res.on('end', function (res) {
      //            ret = JSON.parse(body);
      d.resolve(body);
      body = void (0);
    });
  }).on('error', function (e) {
    console.log(e);
    d.reject(e);
  });
  return d.promise;
}

