var tumblr = require('./tumblr');
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
}
