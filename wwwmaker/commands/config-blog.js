const os = require('os');
const path = require('path');
const resolveHome = require('./resolveHome');
const fs = require('fs');

module.exports = {
  srcJsDir: './src/blog/js/',
  srcNodeDir: './src/node/',
  srcEjsDir: './src/blog/ejs/',
  srcCssDir: './src/blog/css/',
  destCssDir:'./src/blog/ejs/amp/',
  destBasePath: resolveHome('~/www/blog/contents'),
  destRepoDir: resolveHome('~/www/blog'),
  destEjsDir: resolveHome('~/www/blog/contents/'),
  wwwRootDir: resolveHome('~/www/html/contents/'),
  archiveDir:'archive/',
  archiveCategoryDir:'archive/category/',
  mdDir: './data/blog/contents/',
  mdRepoDir: './data',
  //mdDir: './data/blog/test/',
  cacheDir: './data/blog/temp/cache/',
  imageCacheDir: 'image/',
  repoMdDir: 'blog/contents/',
  //repoMdDir: 'blog/contents/',
  entriesPath: './data/blog/entries.json',
  //entriesPath: './data/blog/entries-test.json',
  siteUrl: 'https://www.sfpgmr.net/',
  alterUrl: 'https://alter.sfpgmr.net/',
  siteDomain: 'sfpgmr\.net',
  siteBlogRoot: 'blog/',
  siteContentPath: 'entry/',
  siteAtomDir:'feed/',
  ampDir:'amp/',
  contentRoot:'contents/',
  pushAutomatic:true,
  author:'SFPGMR',
  authorLink:'https://www.sfpgmr.net/profile.html#sfpgmr',
  'json-ld':{
    '@context': {
      '@vocab': 'http://schema.org/',
      '@base': 'https://sfpgmr.net/',
      'sf':'https://www.sfpgmr.net/'
    },
    'sf:blogConfig': {
      'Blog': {
        '@type': 'Blog',
        'url': 'https://sfpgmr.net/blog/',
        '@id':'/#blog',
        'headline': 'S.F. Blog',
        'name': 'S.F. Blog',
        'about': 'IT技術や音楽に関する制作物の公開、情報発信を行っています。',
        'keywords': 'Programming,Music,C++,DirectX,HTML5,WebGL,javascript,WebAudio',
        'author': {
          '@type': 'Person',
          '@id': '/profile.html#sfpgmr',
          'name': 'Satoshi Fujiwara',
          'image': {
            '@type': 'ImageObject',
            'url': 'https://sfpgmr.net/img/sfpgmr.png',
            'width':'256',
            'height':'256'
          },
          'alternateName': 'SFPGMR'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'SFPGMR'
        },
        "isPartOf":{"@id":"/#webiste"}
      },
      'sf:templates': {
        'sf:pageTemplate': '',
        'sf:listTemplate': ''
      },
      'sf:copylight':'All rights reserved 2017, Satoshi Fujiwara',
      'sf:stylesheet':'',
      'sf:blogPostingDefaults': {
        '@type': 'BlogPosting',
        '@id': '',
        'mainEntityOfPage':{
          '@type':'WebPage',
          '@id':''
        },
        'url': '',
        'keywords': '',
        'about': '',
        'author': {
          '@id': '/profile.html#sfpgmr'
        },
        'image': {
          '@type': 'ImageObject',
          'url': 'https://sfpgmr.net/img/sf.png',
          'width':'128',
          'height':'128'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'SFPGMR',
          'logo':{
            '@type': 'ImageObject',
            'url': 'https://sfpgmr.net/img/sfblog.png',
            'width':'640',
            'height':'640'
          }
        },
        "isPartOf":{"@id":"/#blog"}
      }
    }  
  }
};
