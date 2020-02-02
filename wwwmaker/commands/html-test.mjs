import parser from './html-parser.js';

let html = `
<!DOCTYPE html>
<html lang="ja" prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# article: http://ogp.me/ns/article#">
<head>
<meta charset="UTF-8" />
<title>このサイトについて</title>

<link rel="canonical" href="https://www.sfpgmr.net/about.html" />

<meta name="description" content="Programming,Music,Game,etc.." />
<meta name="keywords" content="Programming,Music,HTML5,WebGL,javascript,WebAudio" /> 	
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta itemprop="image" content="img/sfweb.png" />
<meta itemprop="name" content="S.F. Web" />

<meta name="twitter:card" content="summary" />
<meta name="twitter:site" content="@sfpgmr" />
<meta name="twitter:url" content="https://www.sfpgmr.net/about.html" />
<meta name="twitter:title" content="S.F. Web" />
<meta name="twitter:description" content="Programming,Music,Game,etc.." />
<meta name="twitter:image" content="https://www.sfpgmr.net/img/sfweb.png" />

<meta property="og:type" content="article">
<meta property="og:url" content="https://www.sfpgmr.net/about.html" />
<meta property="og:title" content="S.F. Web" />
<meta property="og:site_name" content="S.F. Web" />
<meta property="og:description" content="Programming,Music,Game,etc..">
<meta property="og:image" content="https://www.sfpgmr.net/img/sfweb.png">

<script src="//cdnjs.cloudflare.com/ajax/libs/d3/4.4.1/d3.min.js"></script>
<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<link rel="stylesheet" type="text/css" media="all" href="./css/sfstyle-home.css" />
<link rel="icon" href="img/sfweb-icon.png" />
<link rel="apple-touch-icon" sizes="128x128" href="img/sfweb-icon.png">
<script type="text/javascript">
    if (!window.location.hostname.match(/localhost/)) {
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-15457703-9']);
        _gaq.push(['_trackPageview']);
        (function () {
            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();
    }
</script>
<script type="application/ld+json">
{
 "@context": {
  "@vocab": "http://schema.org/",
  "@base": "https://www.sfpgmr.net/"
 },
 "@type": "WebSite",
 "url": "https://www.sfpgmr.net/about.html",
 "headline": "S.F. Web",
 "name": "S.F. Web",
 "about": "IT技術や音楽に関する制作物の公開、情報発信を行っています。",
 "keywords": "Programming,Music,C++,DirectX,HTML5,WebGL,javascript,WebAudio",
 "author": {
  "@type": "Person",
  "@id": "./profile.html#sfpgmr",
  "name": "Satoshi Fujiwara",
  "image": "https://zwruag-bn1305.files.1drv.com/y3mFBuAXaFp6eZEIswK7KTEL7DTVzrpSxGKqJ7xHWSLwz5MgMJHIM4lvatwuA3gOSZOw_SP2xK_OEpvkHsczcUpmUa-NiWXHZbOgoIMZX7JLAHo2q4wThQrFls8P-uT35rewqyT6GvvsGLzwqDWXunYCUEISi51cCxhE8UTbDiVTtc?width=100&height=100&cropmode=none",
  "alternateName": "SFPGMR"
 }
}
</script>
<script type="application/ld+json">
{
 "@type": "WebPage",
 "@id": "./about.html",
 "url": "./about.html",
 "datePublished": "2017-01-10T08:00:00+08:00",
 "dateModified": "2017-01-12T08:00:00+08:00",
 "headline": "S.F. Web",
 "image": {
  "@type": "ImageObject",
  "url": "./img/sfweb.png",
  "width": "640",
  "height": "640"
 },
 "name": "S.F. Web",
 "about": "Programming,Music,Game,etc..",
 "author": {
  "@type": "Person",
  "@id": "./profile.html#sfpgmr",
  "name": "Satoshi Fujiwara",
  "image": "https://zwruag-bn1305.files.1drv.com/y3mFBuAXaFp6eZEIswK7KTEL7DTVzrpSxGKqJ7xHWSLwz5MgMJHIM4lvatwuA3gOSZOw_SP2xK_OEpvkHsczcUpmUa-NiWXHZbOgoIMZX7JLAHo2q4wThQrFls8P-uT35rewqyT6GvvsGLzwqDWXunYCUEISi51cCxhE8UTbDiVTtc?width=100&height=100&cropmode=none",
  "alternateName": "SFPGMR"
 },
 "keywords": "Programming,Music,HTML5,WebGL,javascript,WebAudio",
 "description": "IT,Music,etc..",
 "relatedLink": [
  "http://github.sfpgmr.net",
  "http://blog.sfgpmr.net/"
 ],
 "@context": {
  "@vocab": "http://schema.org/",
  "@base": "https://www.sfpgmr.net/",
  "sf": "https://www.sfpgmr.net/"
 }
}
</script>
</head>
<body dir="ltr" style="text-align:left;">
<nav class="main-nav" data-sf-name="main" >
    <div class="nav-header">
    <button class="nav-button" data-sf-target="main">
      <svg width="32" height="32" viewbox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g>
        <line  id="svg_3" y2="8.750003" x2="26.249993" y1="8.750003" x1="5.750022" fill-opacity="null" stroke-opacity="null" stroke-width="4" stroke="#fff" fill="none"/>
        <line  id="svg_4" y2="16.749992" x2="26.249993" y1="16.749992" x1="5.750022" fill-opacity="null" stroke-opacity="null" stroke-width="4" stroke="#fff" fill="none"/>
        <line  id="svg_5" y2="24.749981" x2="26.249993" y1="24.749981" x1="5.750022" fill-opacity="null" stroke-opacity="null" stroke-width="4" stroke="#fff" fill="none"/>
      </g>
    </svg>
    </button>
    <div class="nav-title"><a  class="nav-item" href="/" >S.F. Web</a></div>
    </div>

    <ul class="nav-items nav-display-default">

</ul>
</nav>

<header>
<div class="header">
<h1>S.F. Web</h1>

<div class="about">Programming,Music,Game,etc..
</div>

</div>
</header>
<main>
<h2>Contents</h2>
<div class="contents">
 

<aside class="item ad">
<h3>広告</h3>
<!-- sfpg -->
<ins class="adsbygoogle ad"
     style="display:block"
     data-ad-client="ca-pub-4402137407996189"
     data-ad-slot="8395972920"
     data-ad-format="auto"></ins>

</aside>
<script>
(adsbygoogle = window.adsbygoogle || []).push({});
</script>

<article class="item">
<h3><a href="./webpages/web.html" >Web関連</a></h3>

<a href="./webpages/web.html"  ><img src="./img/web.svg"  alt="Web関連" /></a>
<div>HTML5,JS,WebGL,WebAudio,SNS API等のコンテンツ </div>
</article>

<article class="item">
<h3><a href="./webpages/server-desktop.html" >Web Server/Dekstop関連</a></h3>

<a href="./webpages/server-desktop.html"  ><img src="./img/web-desktop.svg"  alt="Web Server/Dekstop関連" /></a>
<div>node.js,electron,nw.js,nginx等のコンテンツ </div>
</article>

<article class="item">
<h3><a href="./webpages/windows-cpp.html" >Windows/C++</a></h3>

<a href="./webpages/windows-cpp.html"  ><img src="./img/win-cpp.svg"  alt="Windows/C++" /></a>
<div>Windowsアプリ/API/C++言語に関するコンテンツ。音楽/グラフィック(DirectX)系の話題が多いです。 </div>
</article>

<article class="item">
<h3><a href="http://blog.sfpgmr.net/" >Blog</a></h3>

<a href="http://blog.sfpgmr.net/"  ><img src="./img/hatenablog.svg"  alt="Blog" /></a>
<div>Programming,Music,etc.いろいろな事を書いています。最近はHTML5,WebGL,JSの話題が多くなっています。 </div>
</article>

<article class="item">
<h3><a href="https://www.youtube.com/user/SFPG" >You Tube Channel</a></h3>

<a href="https://www.youtube.com/user/SFPG"  ><img src="./img/youtube.svg"  alt="You Tube Channel" /></a>
<div><p>私のYou Tube Channelです。<br/>YMOのカバー曲を動画化したものを中心に置いています。</p> </div>
</article>

<article class="item">
<h3><a href="http://qiita.com/SFPGMR" >Qiita</a></h3>

<a href="http://qiita.com/SFPGMR"  ><img src="./img/qiita.svg"  alt="Qiita" /></a>
<div><p>技術的なTipsはこちらに書いています。</p> </div>
</article>

<article class="item">
<h3><a href="https://github.com/sfpgmr?tab=repositories" >GitHub Respository</a></h3>

<a href="https://github.com/sfpgmr?tab=repositories"  ><img src="./img/github.svg"  alt="GitHub Respository" /></a>
<div><p>私のGitHubレポジトリです。</p> </div>
</article>

<article class="item">
<h3><a href="http://sfpgmr.tumblr.com/" >Tumblr</a></h3>

<a href="http://sfpgmr.tumblr.com/"  ><img src="./img/tumblr.svg"  alt="Tumblr" /></a>
<div>ほとんどリブログしかしておりませんが。 </div>
</article>

<article class="item">
<h3><a href="https://twitter.com/SFPGMR" >Twitter</a></h3>

<a href="https://twitter.com/SFPGMR"  ><img src="./img/twitter.svg"  alt="Twitter" /></a>
<div>ごくたまに呟いています。あとはコンテンツの更新連絡用でしょうか。 </div>
</article>

</div>
<aside style="height:120px;">
<!-- S.F.Page Footer ad -->
<ins class="adsbygoogle ad"
     style="display:block;min-height:100px"
     data-ad-client="ca-pub-4402137407996189"
     data-ad-slot="6180865322"
     data-ad-format="auto"></ins>
<script>
(adsbygoogle = window.adsbygoogle || []).push({});
</script>

</aside>
</main>
<footer style="text-align:center;">
<small>Copylight &copy; 2017 Satoshi Fujiwara. </small>
<button id="scroll-top">
<svg width="12px" height="16px" viewBox="0 0 12 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Octicons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="triangle-up" fill="#fff">
            <polygon id="Shape" points="12 11 6 5 0 11"></polygon>
        </g>
    </g>
</svg>  
</button>
</footer>
<script src="/scripts/sfstyle.js" ></script>
</body>
</html>`;

console.log(JSON.stringify(parser.parse(html),null,1));
