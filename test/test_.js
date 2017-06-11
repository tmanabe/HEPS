const system = require("system"),
      page = require("webpage").create(),
      heps_path = system.args[1],
      html_path = system.args[2];

phantom.outputEncoding = "utf8";
page.onConsoleMessage = function(s){ console.log(s); }
page.onError = page.onConsoleMessage;

if(system.args.length !== 3) {
    console.log("Wrong arguments at " + html_path);
    phantom.exit(8);
}

page.open(html_path, function(status) {
    if(status !== "success") {
        console.log("Failed to load " + html_path + " by " + status);
        phantom.exit(4);
    }
    status = page.injectJs(heps_path);
    if(!status) {
        console.log("Failed to inject " + heps_path);
        phantom.exit(2);
    }
    status = page.evaluate(function() {
        return window.HEPS.test_status;
    });
    if(status !== "success") {
        console.log(status);
        phantom.exit(1);
    }
    phantom.exit(0);
});
