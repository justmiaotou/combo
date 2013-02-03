var config = require('../config'),
    debug = {};
for (var method in console) {
    debug[method] = (function(method) {
        return function() {
            if (config.debug) {
                console[method].apply(console, arguments);
            }
        }
    })(method);
}

module.exports = debug;
