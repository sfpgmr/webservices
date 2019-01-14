module.exports = {
  srcJsDir: './src/blog/js/',
  srcNodeDir: './src/node/',
  srcEjsDir: './src/blog/ejs/',
  srcCssDir: './src/blog/css/',
  destBasePath: '/var/www/blog',
  destEjsDir: '/var/www/blog/',
  wwwRootDir: '/var/www/html/contents/',
  archiveDir:'archive/',
  archiveCategoryDir:'archive/category/',
  mdDir: './data/blog/contents/',
  //mdDir: './data/blog/test/',
  cacheDir: './data/blog/temp/cache/',
  imageCacheDir: 'image/',
  repoMdDir: 'wwwmaker/data/blog/contents/',
  //repoMdDir: 'wwwmaker/data/blog/test',
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
  pushAutomatic:false,
  author:'SFPGMR',
  authorLink:'https://www.sfpgmr.net/profile.html#sfpgmr',
  'json-ld':{
    '@context': {
      '@vocab': 'http://schema.org/',
      '@base': 'https://blog.sfpgmr.net/',
      'sf':'https://www.sfpgmr.net/'
    },
    'sf:blogConfig': {
      'Blog': {
        '@type': 'Blog',
        'url': 'https://www.sfpgmr.net/blog/',
        'headline': 'S.F. Blog',
        'name': 'S.F. Blog',
        'about': 'IT技術や音楽に関する制作物の公開、情報発信を行っています。',
        'keywords': 'Programming,Music,C++,DirectX,HTML5,WebGL,javascript,WebAudio',
        'author': {
          '@type': 'Person',
          '@id': 'https://www.sfpgmr.net/profile.html#sfpgmr',
          'name': 'Satoshi Fujiwara',
          'image': {
            '@type': 'ImageObject',
            'url': 'https://www.sfpgmr.net/img/sf.png',
            'width':'128',
            'height':'128'
          },
          'alternateName': 'SFPGMR'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'SFPGMR'
        }
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
          '@id':'https://www.sfpgmr.net/blog/'
        },
        'url': '',
        'keywords': '',
        'about': '',
        'author': {
          '@id': 'https://www.sfpgmr.net/profile.html#sfpgmr'
        },
        'image': {
          '@type': 'ImageObject',
          'url': 'https://www.sfpgmr.net/img/sf.png',
          'width':'128',
          'height':'128'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'SFPGMR',
          'logo':{
            '@type': 'ImageObject',
            'url': 'https://www.sfpgmr.net/img/sfblog.png',
            'width':'640',
            'height':'640'
          }
        }
      }
    }  
  }
};
