var request = require('request');

// Wrapper around request so that we can stub it.
var out = module.exports = {
    run: request,
    restore: function () {
        out.run = request;
    },
};
