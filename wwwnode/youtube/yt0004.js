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
    header : 
 '<form class="navbar-form navbar-left" role="search" id="search">' +
        '<div class="form-group">' +
        '<div class="input-group input-group-sm">' +
        '<select id="type" style="width:100px" class="form-control">' +
        '<option value="channel">Channel</option>' +
        '<option value="video">Video</option>' +
        '<option value="playlist">PlayList</option>' +
        '</select>' +
        '<input id="keyword" style="width:160px" type="text" class="form-control" placeholder="キーワードを入力" />' +
        '</div>' +
        '</div>' +
        '</form>',
    title : 'YouTube Viewer',
    description: '検索したいタイプ（Channel,Video,Playlist）を選択、検索ボックスにキーワードを入力し、エンターキーを押すと検索結果をサムネイルで表示します。チャンネルやプレイリストをクリックすると動画一覧を表示します。動画一覧にマウスカーソルをポイントするとプレビュー再生します。',
    keywords : 'Youtube,d3.js,Q.js,jquery',
    author: 'sfpgmr',
    datetime: now.toISOString(),
    datestr: now.toISOString()
  };
  //console.log(d3.select('body').html());
  contentPath = config.contentRoot + '/test/Youtube/0004/index.html';
  return writeFile(config.contentRoot + '/test/Youtube/0004/index.html', renderer.render('template_yt0004.html', data), 'utf-8');
})
.catch(function (e) {
  console.log(e);
})
.done(function () {
  console.log('処理終了');
});
