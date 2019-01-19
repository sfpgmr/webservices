import  http from 'http';
import resolveHome from '../resolveHome.mjs';
import fs from 'fs';
const  api_key = fs.readFileSync(resolveHome('~/www/node/keys/nodeweb1/api_key.json')).api_key;

export function getPosts(params, func, errFunc)
{
    var api_path = '/v2/blog/';

    if (!params.base_hostname || typeof(params.base_hostname) != 'string' || params.base_hostname =='')
    {
        api_path += 'sfpgmr.tumblr.com';
    } else
    {
        api_path += params.base_hostname;
    }

    api_path += '/posts';

    if (typeof (params.type) == 'string')
    {
        //       if(params.type == 'text' || )
        api_path += '/' + patams.type;

    }

    api_path += '?api_key=' + api_key;

    if (params.id)
    {
        api_path += '&id=' & encodeURIComponent(params.id);
    }

    if (params.tag)
    {
        api_path += '&tag=' & encodeURIComponent(params.tag);
    }
    var limit = parseInt(params.limit);
    if (!isNaN(limit))
    {
        if (limit > 20) limit = 20;
        api_path += '&limit=' + limit;
    }

    var offset = parseInt(params.offset);
    if (!isNaN(offset))
    {
        api_path += '&offset=' + offset;
    }

    if (typeof (params.reblog_info) == 'boolean')
    {
        api_path += '&reblog_info' + params.reblog_info;
    }

    if (typeof (params.notes_info) == 'boolean')
    {
        api_path += '&notes_info' + params.notes_info;
    }

    if (typeof (params.format) == 'string')
    {
        if (params.format == 'html' || params.format == 'text')
        {
            api_path += '&format=' + params.format;
        }
    }


    http.get({
        host: 'api.tumblr.com',
        path: api_path
    },
     function (clres)
     {

         var content = "";

         clres.on('data', function (chunk)
         {
             content += chunk; // 部分データを積み上げる
         }).on('end', function ()
         {
//             console.log(content);
             func(content);
         });
     }).on('error', function (e)
     {
//         console.log(e);
         errFunc(e);
     });
};

export function getInfo (base_hostsname, func, errFunc)
{
  var api_path = 'http://api.tumblr.com/v2/blog/';
  if (!params || !params.base_hostname)
  {
    api_path += 'sfpgmr.tumblr.com/';
  } else
  {
    api_path += params.base_hostname + '/';
  }
  http.get({
    host: 'api.tumblr.com',
    path: api_path + '?api_key=' + api_key
  },
    function (clres)
    {

      var content = '';

      clres.on('data', function (chunk)
      {
        content += chunk; // 部分データを積み上げる
      }).on('end', function ()
      {
        //             console.log(content);
        func(content);
      });
    }).on('error', function (e)
    {
      //         console.log(e);
      errFunc(e);
    });
}