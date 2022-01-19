
import createError from 'http-errors';
//import express from 'express';
import Koa from 'koa';
import serve from 'koa-static';
import Router from 'koa-router';
import mount from 'koa-mount';
import json from 'koa-json';

import logger from 'koa-morgan';

//import tumblerRouter from './routes/tumblr.mjs';
import webhookHandler from './routes/webhook.mjs';

import fs from 'fs';
import path from 'path';
import resolveHome from './resolveHome.mjs';
import bodyParser from 'koa-bodyparser';
import webhook from 'koa-webhook';
import helmet from 'koa-helmet';
//import csp from 'koa-csp';
const serveOpts = {extensions:['html','htm'],format:false};

//express.static.mime.types['wasm'] = 'application/wasm';

const app = new Koa();
const router = new Router();
/*app.use(csp({
	enableWarn:true,
	policy:{
		'default-src':['self','*.sfpgmr.net','youtube.com','twitter.com'],
		'img-src':['*']
	}
}));*/
app.use(helmet({
	contentSecurityPolicy:false
}));
app.use(json());
app.use(bodyParser({jsonLimit:'10mb'}));
//app.use(xhub({algorithm: 'sha1', secret: fs.readFileSync(resolveHome('~/www/webservices/keys/webhook/secret'),'utf-8').trim()}));

app.use(logger('combined'));

//app.use(cookie());


app.use(async (ctx,next)=> {
  if (ctx.hostname == 'blog.sfpgmr.net') {
    ctx.status = 301;
    ctx.redirect('https://www.sfpgmr.net/blog' + ctx.url);
    //ctx.set('SameSite','None');
    //ctx.set('Secure','');
    //ctx.set('Access-Control-Allow-Origin', '*');
  } else {
  //ctx.set('Access-Control-Allow-Origin', '*');
  //ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  //ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  //ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  //ctx.set('SameSite','None');
  //ctx.set('Secure','');
  await next();
  }
});

app.use(mount('/metrop/',serve('../metrop/html',serveOpts)));
app.use(mount('/images/',serve(resolveHome('~/www/images/'),serveOpts)));
app.use(mount('/blog/',serve(resolveHome('~/www/blog/contents/'),serveOpts)));
app.use(mount('/content/',serve(resolveHome('~/www/images/content'),serveOpts)));

// 
// const staticContentsBase = resolveHome('~/www/html/contents/');
// fs.readdirSync(staticContentsBase,{withFileTypes: true}).forEach(d=>{
//   if(d.isDirectory()){
//     console.log(d.name);
//     app.use(mount(`/${d.name}/`,serve(path.join(staticContentsBase,d.name),serveOpts)));
//   }
// });

app.use(mount('/javascripts/',serve(resolveHome('~/www/webservices/webserver/public/javascripts/'),serveOpts)));
app.use(mount('/stylesheets/',serve(resolveHome('~/www/webservices/webserver/public/stylesheets/'),serveOpts)));
app.use(mount('/webhook/',webhook(fs.readFileSync(resolveHome('~/www/webservices/keys/webhook/secret'),'utf-8').trim()),webhookHandler()));
app.use(mount('/',serve(resolveHome('~/www/html/contents/'),serveOpts)));
//console.log(resolveHome('~/pj/sandbox/new-site/data/'));
//app.use(mount('/',serve(resolveHome('/home/sfpg/pj/sandbox/new-site/data/'),serveOpts)));
app.use(router.routes());
app.use(router.allowedMethods());


// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(async (ctx, next) =>{
//   // set locals, only providing error in development
//   ctx.response.res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('./error',{message:'error',error:err});
// });

export default app;
