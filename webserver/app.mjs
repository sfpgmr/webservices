
import createError from 'http-errors';
//import express from 'express';
import Koa from 'koa';
import serve from 'koa-static';
import Router from 'koa-router';
import mount from 'koa-mount';
import render from 'koa-ejs';
import json from 'koa-json';

//import expressStaticGzip from "./express-static-gzip.mjs";
//import cookieParser from 'cookie-parser';

//import cookie from 'koa-cookie';

//import logger from 'morgan';
import logger from 'koa-morgan'

//import tumblerRouter from './routes/tumblr.mjs';
import webhookHandler from './routes/webhook.mjs';
//import xhub from 'express-x-hub';
import xhub from 'koa-x-hub';

import fs from 'fs';
import resolveHome from './resolveHome.mjs';
import bodyParser from 'koa-bodyparser';
import webhook from 'koa-webhook';

//express.static.mime.types['wasm'] = 'application/wasm';

const app = new Koa();
const router = new Router();
app.use(json());
app.use(bodyParser({jsonLimit:'10mb'}));
//app.use(xhub({algorithm: 'sha1', secret: fs.readFileSync(resolveHome('~/www/node/keys/webhook/secret'),'utf-8').trim()}));

app.use(logger('combined'));

//app.use(cookie());

app.use(async (ctx,next)=> {
  if (ctx.request.hostname == 'blog.sfpgmr.net') {
    ctx.status = 301;
    ctx.response.redirect('https://www.sfpgmr.net/blog' + req.url);
  } else {
    await next();
  }
});

app.use(mount('/metrop/',serve('../metrop/html')));
//app.use(mount('/metrop/data/',serve('../metrop/html/data/')));
app.use(mount('/images/',serve(resolveHome('~/www/images/'))));
app.use(mount('/blog/',serve(resolveHome('~/www/blog/contents/'))));
app.use(mount('/content/',serve(resolveHome('~/www/images/content'))));

app.use(mount('/javascripts/',serve(resolveHome('~/www/node/webserver/public/javascripts/'))));
app.use(mount('/stylesheets/',serve(resolveHome('~/www/node/webserver/public/stylesheets/'))));


//app.use('/', indexRouter);
//app.use('/users', usersRouter);
//router.use('/tumblr/',tumblerRouter);
//app.use('/tumblr',tumblerRouter);
//app.use(bodyParser.json({limit:'100mb',parameterLimit:50000}));
//app.use(bodyParser.urlencoded({ extended: true,limit:'100mb',parameterLimit:50000 }));
//router.use('/webhook',webhookRouter);
//app.use('/webhook/',bodyParser.json({limit:'50mb',type: 'application/*+json'}),webhookRouter);
app.use(mount('/webhook/',webhook(fs.readFileSync(resolveHome('~/www/node/keys/webhook/secret'),'utf-8').trim()),webhookHandler()));
app.use(mount('/',serve(resolveHome('~/www/html/contents/'))));
//.use(router.routes());
//  .use(router.allowedMethods());


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
