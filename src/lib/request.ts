import request = require("request");

export = {
    run: request,
    restore() {
        this.run = request;
    },
};
