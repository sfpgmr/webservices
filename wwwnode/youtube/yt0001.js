//
// Youtube API Sample
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

q.all([readFile('../apikey.json', 'utf-8'), readFile('../config.json', 'utf-8')])
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
      .then(function (dt) {
        console.log(dt);
        result.concat(dt);
        if (dt.nextPageToken) {
          getData(dt.nextPageToken);
        } else {
          defer.resolve();
        }
      });
    }
    console.log('start');
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
                  .attr('href', function (d) {
                    var contentsUrl = 'https://www.youtube.com/';
                    if (d.id.kind == 'youtube#playlist') {
                      contentsUrl += 'playlist?list=' + d.id.playlistId;
                    } else if (d.id.kind == 'youtube#video') {
                      contentsUrl += 'watch?v=' + d.id.videoId;
                    } else if (d.id.kind == 'youtube#channel') {
                      contentsUrl += 'channel/' + d.id.channelId;
                    }
                    return contentsUrl;
                  })
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
        header : '<a class="navbar-brand" href="#" property="headLine" id="headLine" style="margin-top:auto;margin-bottom:auto;">Youtube Test</a>',
        title : 'Youtube Test 0001 - 動画をサムネイルする',
        description: 'Youtube Test 0001 - 動画をサムネイルする',
        keywords : 'Youtube,d3.js',
        author: 'sfpgmr',
      articleBody: d3.select('body').html(),
        datetime:now.toISOString(),
        datestr:now.toISOString()
    };
    //console.log(d3.select('body').html());
      return writeFile(config.contentRoot + '/test/Youtube/0001' + '/index.html', renderer.render('template_yt0001.html', data), 'utf-8');
  });
  return defer.promise;    
})
.catch(function (e) {
    console.log(e);
})
.done(function () {
  console.log('処理終了');
});

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
