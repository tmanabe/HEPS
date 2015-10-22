var system = require("system"),
    page = require("webpage").create();

const heps_path = system.args[1],
      url = system.args[2];

phantom.outputEncoding = "utf8";
page.onConsoleMessage = null;
page.onError = null;
// page.onConsoleMessage = (page.onError = function(s){ console.log(s); }) // Debug
page.settings.resourceTimeout = 30 * 60 * 1000; // ms = 30 minutes

if(system.args.length !== 3) {

    console.log("Usage: phantomjs " + system.args[0] + " heps_path url");
    phantom.exit(100);

}

page.open(url, function(status) {

    if(status !== "success") phantom.exit(1);

    if(page.injectJs(heps_path) ) {

        var buffer = page.evaluate(function() {

            return window.HEPS.json;

        });

        system.stdout.write(buffer);
        phantom.exit(0);

    } else {

        phantom.exit(1);

    }

});
