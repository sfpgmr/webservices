var tumblr = require('./tumblr');
var api_key = require('./api_key');
exports.getTumblrPosts = function (req, res)
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
};

exports.getTumblrInfo = function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  tumblr.getInfo(req.query, function (data)
  {
    res.send(data);
  }, function (e) { });

};

exports.getTumblrAPIKey = function (req, res)
{
  res.contentType('application/json');
  res.header('Cache-Control', 'No-Cache');
  res.header('Pragma', 'No-Cache');
  res.send(JSON.stringify({'key':api_key.get()}));
};