// this exposes two methods: createNewFeed and getFeedXML
var rss = require('node-rss');

// first we create a "feed" object that will define your feed
// method signature: function createNewFeed(title, link, desc, author, feedLink, options)
// title : title of your feed
// link : link to your website
// desc : description of your feed
// author : author of the feed
// feedLink : link to the feed
// options : additional options, explained below
var feed = rss.createNewFeed('Blog Most Recent', 'http://someurl.com/',
    'Most recent blog entries from blog',
    'EJ Bensing',
    'http://someurl.com/rss/MostRecent.xml',
    { 'CustomTag': 'This is a custom tag under the channel tag!' });

// the additional options parameter can essentially be used to
// arbitrarily change the xml that will be created or other defaults.
// currently, it only supports basic tags, where it will take a
// key : value and turn it into <key>value</key>, but future releases
// will contain the ability to specify attributes

//next, we need to add some items to the feed
// create some dummy data to loop over...
var blogs = [
    { title: 'blog post 1', url: 'http://someurl.com/blog1', pubDate: new Date(), description: 'this is a description' },
    { title: 'blog post 2', url: 'http://someurl.com/blog2', pubDate: new Date(), description: 'this is a description' },
    { title: 'blog post 3', url: 'http://someurl.com/blog3', pubDate: new Date(), description: 'this is a description' },
    { title: 'blog post 4', url: 'http://someurl.com/blog4', pubDate: new Date(), description: 'this is a description' },
    { title: 'blog post 5', url: 'http://someurl.com/blog5', pubDate: new Date(), description: 'this is a description' },
    { title: 'blog post 6', url: 'http://someurl.com/blog6', pubDate: new Date(), description: 'this is a description' },
];


// add some items to the feed
// each feed object has a function addNewItem which should be used for adding new items
// method signature : function addNewItem(itemTitle, itemLink, pubDate, description, fields)
// itemTitle : Title of the item
// itemLink : Link to the item
// pubDate : Date the item was created/published
// description : description of item
// fields : functions exactly like the "options" parameter of createNewFeed,
// allows the user to add arbitrary tags to an item
blogs.forEach(function (blog) {
    feed.addNewItem(blog.title, blog.url, blog.pubDate, blog.description, {});
});

// now to get the XML simply call the getFeedXML function
var xmlString = rss.getFeedXML(feed);
console.log(xmlString);