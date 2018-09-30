//
// index.htmlを生成する
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

var util = require('util'),
    twitter = require('twitter');
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
    var root = config.contentRoot + '/test';
    console.log(root);
    var twit = new twitter(keys.twitter);
    
    var fileObjs = [];
    makeSample(root, '/test', fileObjs)
    .then(function () {
       
        var width = 960,
            height = 2000;
        
        var tree = d3.layout.tree()
        .size([height, width - 160]);
        
        var diagonal = d3.svg.diagonal()
        .projection(function (d) { return [d.y, d.x]; });
        
        var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(40,0)");
        
        var nodes = tree.nodes({ name: '/', children: fileObjs }),
            links = tree.links(nodes);
        
        var link = svg.selectAll("path.link")
        .data(links)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", diagonal);
        
            var node = svg.selectAll("g.node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; })
        
        node.append("circle")
      .attr("r", 4.5);
        
        node.append("text")
      .attr("dx", function (d) { return d.children ? -8 : 8; })
      .attr("dy", 3)
      .attr("text-anchor", function (d) { return d.children ? "end" : "start"; })
      .text(function (d) { return d.name; });
        
        var renderer = ect({ root : './' });
        var data = {
          title : 'd3.jsサンプル',
          description: 'd3.jsサンプルのインデックスページです。',
          keywords : 'd3.js',
          author: 'sfpgmr',
          articleBody: d3.select('body').html()
        };
        return writeFile(config.contentRoot + '/test/d3/0001' + '/index.html', renderer.render('template_0001.html', data), 'utf-8');
      })
    ;

    // 今月のtweetをかき集める
    //getTweetsCurrentMonth(twit)
    //.then(function (data) {
    //    console.log(data);
    //});
  })
.catch(function (e) {
    console.log(e);
  });

//
function makeSampleSync(path, vpath, fileobjs) {
  var files = fs.readdirSync(path);
  files.forEach(function (name) {
    var stat = fs.lstatSync(path + '/' + name);
    if (stat.isDirectory()) {
      var obj = { 'stat': stat, 'name': name, 'path' : path + '/' + name, 'vpath': vpath + '/' + name , 'children': [] };
      fileobjs.push(obj);
      makeSampleSync(path + '/' + name, vpath + '/' + name, obj.children);
    }
    if (stat.isFile()) {
      //console.log(path + '/' + name);
      fileobjs.push({ 'stat': stat, 'name': name, 'path' : path + '/' + name, 'vpath': vpath + '/' + name });
    }
  });
}

function makeSample(path, vpath, fileobjs) {
  var defer = q.defer();
  q.nfcall(fs.readdir, path)
  .then(function (files) {
      var promises = [];
      files.forEach(function (name) {
        var defer = q.defer();
        promises.push(defer.promise);
        q.nfcall(fs.lstat, path + '/' + name)
        .then(function (stat) {
            if (stat.isDirectory()) {
              var obj = { 'stat': stat, 'name': name, 'path' : path + '/' + name, 'vpath': vpath + '/' + name , 'children': [] };
              makeSample(path + '/' + name, vpath + '/' + name, obj.children)
            .then(function () {
                  defer.resolve();
                  if (obj.children.length > 0) {
                    fileobjs.push(obj);
                  }
              });
            }
            if (stat.isFile()) {
              if (name.match(/.htm[l]*$/ig)) {
                fileobjs.push({ 'stat': stat, 'name': name, 'path' : path + '/' + name, 'vpath': vpath + '/' + name });
              }
              defer.resolve();
            }
          });
      });
      q.all(promises)
      .then(function () {
          defer.resolve();
        });
    });
  return defer.promise;
}


// 今月のツイートをかき集める
function getTweetsCurrentMonth(twit) {
  var defer = q.defer();
  twit.get.apply(twit, ['/statuses/user_timeline.json', { include_entities: true }, function (data) {
      defer.resolve(data);
    }]);
  return defer.promise;
}

//自分のツイート最新20件
//twit.get('/statuses/user_timeline.json', { include_entities: true }, function (data) {
//  console.log(util.inspect(data));
//});