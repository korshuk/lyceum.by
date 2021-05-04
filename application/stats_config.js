/*jslint node: true */
(function (exports, require) {
    'use strict';
    var express = require('express'),
        mongoose = require('mongoose'),
        db,
        mongoUrl = process.env.MONGO_URL || 'localhost';

    exports.configure = function (app) {
        
        require('../modules/date.js');
        
        app = express();

        app.disable('x-powered-by');

        app.configure(function () {
            app.use(express.bodyParser());
            app.use(express.methodOverride());

            app.set('db-uri', 'mongodb://'+mongoUrl+':27017/lyceum');
            db = mongoose.connect(app.set('db-uri'));
        });

        app.configure('development', function () {
            app.use(express.errorHandler({
                dumpExceptions: true,
                showStack: true
            }));
        });

        app.configure('production', function () {
            app.use(express.errorHandler());
        });
        
        app.portNum = process.env.STATS_PORT || 3030;
        
        return app;
    };
}(exports, require));