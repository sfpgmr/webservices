
import resolveHome from './resolveHome.mjs';
import fs from 'fs';
import { isNullOrUndefined } from 'util';

 const wwwconfig = {
  root:resolveHome("~/www/html/contents/"),
  baseUrl:'https://sfpgmr.net',
  dataDir:'../data',
  "json-ld":{
    "@context": {
      "@vocab": "http://schema.org/",
      "@base": "https://www.sfpgmr.net/",
      "sf":"https://www.sfpgmr.net/"
    },
    "sf:Template":{
      Organization:JSON.parse(fs.readFileSync('./json-ld/Organization.json','utf-8')),
      WebSite:JSON.parse(fs.readFileSync('./json-ld/wwwsite.json','utf-8')),
      Person:JSON.parse(fs.readFileSync('./json-ld/Person.json','utf-8')),
      Article:{
        "@id":null,
        "url":null,
        "author": "./profile.html#sfpgmr",
        "headline":null,
        "image":"https://sfpgmr.net/img/sfweb.png",
        "publisher":{"@id": "/#organization"},
        "isPartOf":null,
        "datePublished":null,
        "dateModified":null,
        "description":null,
        "mainEntityOfPage":null
      },
      WebPage:{
        "@type": "WebPage",
        "@id": null,
        "url": null,
        "headline": null,
        "image": {
          "@type": "ImageObject",
          "url": "https://sfpgmr.net/img/sfweb.png"
        },
        "name": null,
        "author": {
          "@id": "./profile.html#sfpgmr"
        },
        "isPartOf":{
          "@id":"/#website"
        }
      }
    }
  }
};

export default wwwconfig;