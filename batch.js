var system = require("system"),
    page = require("webpage").create();

const js_url = system.args[1],
    html_url = system.args[2];

phantom.outputEncoding = "utf8";
page.onConsoleMessage = null;
page.onError = null;
// page.onConsoleMessage = (page.onError = function(s){ console.log(s); }) // Debug
page.settings.resourceTimeout = 30 * 60 * 1000; // ms = 30 minutes

if(system.args.length !== 3) {

    console.log("Usage: phantomjs " + system.args[0] + " js_url html_url")
    phantom.exit(100);

}

page.open(html_url, function(status) {

    if(status !== "success") phantom.exit(1);

    page.includeJs(js_url, function() {

        var buffer = page.evaluate(function() {

            return window.HEPS.json;

        });

        system.stdout.write(buffer);
        phantom.exit(0);

    });

});
