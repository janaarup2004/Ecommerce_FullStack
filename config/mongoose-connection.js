const mongoose = require("mongoose");
const config = require("config");
const dbgr = require("debug")("development:mongoose");

// Use the full URI from environment or config
const uri = process.env.MONGODB_URI || config.get("MONGODB_URI");

mongoose.connect(uri)
    .then(function () {
        dbgr("connected");
    })
    .catch(function (err) {
        dbgr(err);
    });

module.exports = mongoose;
