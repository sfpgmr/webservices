/// <reference path="./jquery-1.9.1.js" />
/// <reference path="./jquery.cookie.js" />

var youTube;
function onYouTubeIframeAPIReady()
{
  youTube = YT;
}

$().ready(
     function ()
     {

       var page_size = 8; /// 1ページサイズ
       var contents = $('#content'); /// コンテンツブロック
       var width = $(window).width();
       var offset = 0; /// 現在の表示先頭位置
       var cache; /// コンテンツキャッシュ
       var cache_lock = true; /// キャッシュがロックされているかどうか
       var info; /// ブログの情報のキャッシュ
       var api_key;
       var uri_fragment =  'https://' + location.hostname + ':' + location.port 
+ location.pathname.match(/.*\//);
       //$.getJSON('http://' + location.hostname + ':' + location.port + '/getTumblrAPIKey', function (jdata)
       //{
       //  api_key = jdata.key;
         // articleの挿入
         function appendArticle(post, func)
         {
           var article = $('<article>')
              .attr('id', post.id)
              .attr('class', post.type)
              .prop('sf-data', post);
           if (!func)
           {
             contents.append(article);
           } else
           {
             func(contents, article);
           }
           return article;
         }

         // 最適なサイズのサムネイル画像を取得する
         function getPhotoSuitableSize(photoSet, width)
         {
           var photo;

           for (var j = 0; j < photoSet.alt_sizes.length; ++j)
           {
             var alt_size;
             if (j > 0)
             {
               alt_size = photoSet.alt_sizes[j - 1];
             } else
             {
               alt_size = photoSet.alt_sizes[0];
             };

             if (width == photoSet.alt_sizes[j].width)
             {
               return photoSet.alt_sizes[j];
             }

             if (width > photoSet.alt_sizes[j].width || j == (photoSet.alt_sizes.length - 1))
             {
               return alt_size;
             }
           }
         }

         // 写真のレンダリング -----
         function renderPhotos(post, func)
         {

           var article = appendArticle(post, func);
           {
             var photo_content = '';
             var width = article.width();
             article.attr('sf-current-width', width);
             for (var i = 0; i < post.photos.length; ++i)
             {
               var photoSet = post.photos[i];
               var photo = getPhotoSuitableSize(photoSet, width);
               photo_content += '<img src="' + photo.url + '" class="photo" />';
               if (photo.caption != undefined)
               {
                 photo_content += '<caption class="img">' + photo.caption + '</caption>';
               }

             }

             if (post.link_url != undefined)
             {
               photo_content = '<a href="' + post.link_url + '" target="_blank" >' + photo_content + '</a>';
             }

             article.append(
                 '<header><h4>' + post.date + '</h4>' +
                 (post.soucre_title != undefined ? '<h3>' + post.soucre_title + '</h3>' : '') +
                 '<caption>' + post.caption + '</caption>' +
                 '<footer>Tags:' + post.tags.join(',') + '</footer>' +
                 '</header>' + photo_content
                 );
           }
         }

         // リンクのレンダリング -----
         function renderLink(post, func)
         {
           var article = appendArticle(post, func);
           article.append(
            '<header><h4>' + post.date + '</h4></header>' +
            '<a href="' + post.url + '" traget="_blank" >' +
            '<h3>' + post.title + '</h3>' +
            '</a>' +
           //                           '<iframe class="link" src="' + post.url + '"></iframe>' +
            '<caption>' + post.description + '</caption>' +
            '<footer>Tags:' + post.tags.join(',') + '</footer>'
           );
         }


         // クォートのレンダリング -----
         function renderQuote(post, func)
         {
           var article = appendArticle(post, func);
           article.append(
            '<header><h4>' + post.date + '</h4></header>' +
            (post.title ? '<h3>' + post.title + '</h3>' : '') +
            '<div class="quote-text" >"' + post.text + '"</div>' +
            '<blockquote>' + post.source + '</blockquote>' +
            '<footer>Tags:' + post.tags.join(',') + '</footer>'
           );
         }

         // テキストのレンダリング -----
         function renderText(post, func)
         {
           var article = appendArticle(post, func);
           article.append(
            '<header><h4>' + post.date + '</h4></header>' +
            '<a href="' + post.link_url + '" traget="_blank" >' +
            (post.title ? '<h3>' + post.title + '</h3>' : '') +
            '</a>' +
            '<div>' + post.body + '</div>' +
            '<footer>Tags:' + post.tags.join(',') + '</footer>'
           );
         }

         // ビデオのレンダリング

         function renderVideo(post, func)
         {
           var article = appendArticle(post, func);
           article.append(
            '<header><h4>' + post.date + '</h4>' +
            '<caption>' + post.caption + '</caption>' +
            '<div>Tags:' + post.tags.join(',') + '</div>' +
            '</header>' +
            '<a id="video' + post.id + '" href="' + post.permalink_url + '" target="_blank">' +
            '<img src="' + post.thumbnail_url + '" />' +
            '</a>'
           //                    '<div>' + post.player[1].embed_code + '</div>'+
            );
         }

         var renderers = {
           'photo': renderPhotos,
           'link': renderLink,
           'text': renderText,
           'quote': renderQuote,
           'video': renderVideo
         };

         $('#forward').click(forward);

         $('#back').click(back);

         /*    $getJSON('http://' + location.hostname + ':' + location.port + '/getTumblrInfo', function (jdata)
         {
         info = jdata.response.blog;
         });
         */

         $.getJSON(uri_fragment + '/getTumblrPosts?limit=20', function (jdata)
         //$.getJSON('http://api.tumblr.com/v2/blog/sfpgmr.tumblr.com/posts?api_key=' + api_key + '&limit=20&jsonp=?', function (jdata)
         {
           cache = jdata.response.posts;
           info = jdata.response.blog;
           var length = info.posts;
           if (length > page_size) length = page_size;
           for (i = 0; i < length; i++)
           {
             var post = jdata.response.posts[i];
             var renderer = renderers[post.type];
             if (renderer != undefined)
             {
               renderer(post);
             }
           }
           cache_lock = false;
           center_img();
         });

         // キー入力
         $(window).keydown(function (ev)
         {
           switch (ev.keyCode)
           {
             case 39:
               forward()
               break;
             case 37:
               back();
               break;
           }
         });

         // 1秒ごとにキャッシュをチェックし、コンテンツが足りなそうだったら事前に多めに読み込んでおく
         setInterval(function ()
         {
           if (cache_lock) return;
           if ((cache.length - 1) < (offset + 40))
           {
             cache_lock = true;
             $.getJSON(uri_fragment + '/getTumblrPosts?offset=' + (cache.length) + '&limit=20', function (jdata)
             //$.getJSON('http://api.tumblr.com/v2/blog/sfpgmr.tumblr.com/posts?api_key=' + api_key + '&offset=' + (cache.length) + '&limit=20&jsonp=?', function (jdata)
             {
               info = jdata.info;
               for (var i = 0; i < jdata.response.posts.length; ++i)
               {
                 cache.push(jdata.response.posts[i]);
               }
               cache_lock = false;
             });
           }
         }, 1000);

         // イメージを縦方向にセンタリングする
         function center_img()
         {
           if ($(window).width() <= 320) return;

           $('div#content > article.photo').each(function (elm)
           {
             var article = $(this);
             if (article.width() != article.attr('sf-current-width'))
             {
               article.find('img').remove();
               article.find('>caption').remove();
               article.attr('sf-current-width', article.width());
               var width = article.width();
               var post = article.prop('sf-data');
               var photo_content = '';
               for (var i = 0; i < post.photos.length; ++i)
               {
                 var photoSet = post.photos[i];
                 var photo = getPhotoSuitableSize(photoSet, width);
                 photo_content += '<img src="' + photo.url + '" class="photo" />';
                 if (photo.caption != undefined)
                 {
                   photo_content += '<caption class="img">' + photo.caption + '</caption>';
                 }
               }
               article.append(photo_content);
             }
           });

           var first = $('#content > article:first');
           $('#content > article.video').each(function (elm)
           {
             var a = $(this);
/*             if (first.get(0) == a.get(0))
             {
               var data = a.prop('sf-data');
               a.find('#video' + data.id).remove();
               data.permalink_url.match(/v\=([^&]*)/);
               var vid = RegExp.$1;
               a.append('<div id="videoplayer' + data.id + '" ></div>');
               new youTube.Player('videoplayer' + data.id, {
//                 height: '300',
                 width: a.width() - 10,
                 videoId: vid
               });
             } else */
             {
               var data = a.prop('sf-data');
               var player = a.find('#videoplayer' + data.id);
               if (player.length != 0)
               {
                 player.remove();
                 a.append(
            '<a id="video' + data.id + '" href="' + data.permalink_url + '" target="_blank">' +
            '<img src="' + data.thumbnail_url + '" />' +
            '</a>');

               }
             }
           });

           $('#content > article.photo,#content > article.video').each(function (elm)
           {
             var parent = $(this);
             var imgs = parent.find('img');
             if (imgs.length == 1)
             {
               imgs.load(function ()
               {
                 imgs.css('margin-top', (($(parent).height() - imgs.height()) / 2) + 'px');
               });
               imgs.css('margin-top', (($(parent).height() - imgs.height()) / 2) + 'px');
             } else
             {
               var data = parent.prop('sf-data');
               var video = parent.find('#videoplayer' + data.id);
               video.css('margin-top', (($(parent).height() - video.height()) / 2) + 'px');
               video.load(function () { video.css('margin-top', (($(parent).height() - video.height()) / 2) + 'px'); })
             }
           });

         }

         // 1つ先にコンテンツを進める。
         function forward()
         {
           $('#content article:first').remove();
           if ((cache.length - 1) > (offset + 8))
           {
             var post = cache[offset + 8];
             var renderer = renderers[post.type];
             if (renderer != undefined)
             {
               renderer(post);
             }
             offset += 1;
             $('#offset').text(cache.length + ',' + (offset));
             center_img();
           }
         }

         // 1つ前にコンテンツを戻す。
         function back()
         {
           if (offset > 0)
           {
             offset -= 1;
             $('#content article:last').remove();
             $('#offset').text(cache.length + ',' + (offset));
             var renderer = renderers[cache[offset].type];
             if (renderer != undefined)
             {
               renderer(cache[offset], function (o, v) { o.prepend(v); }); ;
             }
             // 最初のarticleが画像もしくは動画の場合かつ画像が単一の場合、縦方向のセンタリングを施す
             center_img();
           }
         }
       //});
     });
