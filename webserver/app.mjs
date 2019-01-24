
import createError from 'http-errors';
import express from 'express';
import expressStaticGzip from "./express-static-gzip.mjs";
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import tumblerRouter from './routes/tumblr.mjs';
import webhookRouter from './routes/webhook.mjs';
import xhub from 'express-x-hub';
import fs from 'fs';
import resolveHome from './resolveHome.mjs';
//import bodyParser from 'body-parser';
//import http2 from 'http2';
//import expressHTTP2Workaround from 'express-http2-workaround';
const app = express();
//app.use(expressHTTP2Workaround({express:express,http2:http2 }));
const staticOpts = {
  extensions:['html','htm'],
  indexFromEmptyFile:true
}
//app.use(bodyParser.json());
// view engine setup
app.set('views', ['./views']);
app.set('view engine', 'ejs');
app.enable('strict routing');

app.use(logger('combined'));

app.use(xhub({ algorithm: 'sha1', secret: fs.readFileSync(resolveHome('~/www/node/keys/webhook/secret'),'utf-8').trim() }));


app.use(bodyParser.json({limit:'50mb',type: 'application/*+json'}));
app.use(bodyParser.urlencoded({ extended: true,limit:'50mb',parameterLimit:10000 }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  //req.url = encodeURIComponent(req.url);
  if (req.hostname == 'blog.sfpgmr.net') {
    res.redirect(301,'https://www.sfpgmr.net/blog' + req.url);
  } else {
    next();
  }
});
app.use('/metrop/',expressStaticGzip(resolveHome('../metrop/html/'),staticOpts));
app.use('/images/',expressStaticGzip(resolveHome('~/www/images/'),staticOpts));
app.use('/blog/',expressStaticGzip(resolveHome('~/www/blog/'),staticOpts));
app.use('/content/',expressStaticGzip(resolveHome('~/www/images/content'),staticOpts));

app.use('/javascripts/',expressStaticGzip(resolveHome('~/www/node/webserver/public/javascripts/'),staticOpts));
app.use('/stylesheets/',expressStaticGzip(resolveHome('~/www/node/webserver/public/stylesheets/'),staticOpts));


//app.use('/', indexRouter);
//app.use('/users', usersRouter);
app.use('/tumblr/',tumblerRouter);
//app.use('/tumblr',tumblerRouter);
//app.use('/webhook',webhookRouter);
app.use('/webhook/',webhookRouter);

app.use('/',expressStaticGzip(resolveHome('~/www/html/contents/')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('./error',{message:'error',error:err});
});



export default app;
