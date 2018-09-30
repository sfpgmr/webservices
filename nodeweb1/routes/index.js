
/*
 * GET home page.
 */


exports.index = function (req, res)
{
    res.render('index', {  title: 'Tumblr Posts Beta' });
};
