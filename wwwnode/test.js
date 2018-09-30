var page = require('webpage').create();
page.open("https://twitter.com/SFPGMR/", function (status) {
    console.log(status);
    page.render("render.png");
    phantom.exit();
});