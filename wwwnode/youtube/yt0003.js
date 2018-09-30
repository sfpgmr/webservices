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
var zlib = require('zlib');
var https = require('https');
var fs = require('fs');
var d3 = require('d3');
var q = require('q');
var ect = require('ect');

var readFile = q.nfbind(fs.readFile);
var writeFile = q.nfbind(fs.writeFile);
var contentPath = '';

q.all([readFile('../apikey.json', 'utf-8'), readFile('../config.json', 'utf-8')])
.spread(function (keys, config) {
    keys = JSON.parse(keys);
    config = JSON.parse(config);
    var json = q.nfbind(d3.json);
    var renderer = ect({ root : './' });
    var now = new Date();
    var data = {
        header : '<a class="navbar-brand" href="#" property="headLine" id="headLine" style="margin-top:auto;margin-bottom:auto;">Youtube API Test</a>',
        title : '再生リストのサムネイルとプレビュー',
        description: 'クリックすると再生リストの中身をサムネイル表示します。サムネイルの上にマウスカーソルを重ねるとプレビュー再生できます。ChannelIDを変更すると他のチャンネルのプレイリストを表示します。',
        keywords : 'Youtube,d3.js,Q.js,jquery',
        author: 'sfpgmr',
        datetime:now.toISOString(),
        datestr:now.toISOString()
    };
  //console.log(d3.select('body').html());
    contentPath = config.contentRoot + '/test/Youtube/0003/index.html';
    return writeFile(config.contentRoot + '/test/Youtube/0003/index.html', renderer.render('template_yt0003.html', data), 'utf-8');
})
.catch(function (e) {
    console.log(e);
})
.done(function () {
  console.log('処理終了');
});
