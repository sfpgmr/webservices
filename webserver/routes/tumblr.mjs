import express from 'express';

const router = express.Router();

import * as tumblr from './tumblrApi.mjs';
//import api_key from '../../keys/nodeweb1/api_key';

router.get('/getTumblrPosts',function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  //    console.log(req.query);
  // req.query.base_hostname = 'shi3z.tumblr.com';
  tumblr.getPosts(req.query, function (data)
  {
    res.send(data);
  }, function (e) { });
});

router.get('/getTumblrInfo',function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  tumblr.getInfo(req.query, function (data)
  {
    res.send(data);
  }, function (e) { });

});



/* exports.getTumblrAPIKey = function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  res.send(JSON.stringify({'key':api_key.get()}));
};
*/

/* GET home page. */

router.get('/', function(req, res, next) {
  res.render('tumblr', {  title: 'Tumblr Posts Beta' });
});

router.get('/index.html', function(req, res, next) {
  res.render('tumblr', {  title: 'Tumblr Posts Beta' });
});



export default router;