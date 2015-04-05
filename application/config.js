/*jslint node: true */
(function (exports, require) {
    'use strict';
    var express = require('express'),
        mongoose = require('mongoose'),
        MongoStore = require('connect-mongo')(express),
        db,
        fs = require('fs'),
        logfile = fs.createWriteStream('./logfile.log', {
            flags: 'a'
        });

    exports.configure = function (app) {
        
        require('../modules/date.js');
        
        app = express();
        
        app.disable('x-powered-by');

        app.configure(function () {
            app.set('views', './views');
            app.set('view engine', 'jade');
            app.set('view options', {
                pretty: true
            });

            app.use(express.logger({
                stream: logfile
            }));

            app.use(express.bodyParser());
            app.use(express.methodOverride());

            app.use(express.static('./public'));

            app.set('db-uri', 'mongodb://localhost/lyceum');
            db = mongoose.connect(app.set('db-uri'));

            app.use('/admin', express.cookieParser('shhhh, very secret'));
            app.use('/admin', express.session({
                store: new MongoStore({
                    url: 'mongodb://localhost/lyceum'
                }),
                secret: 'secret secret'
            }));
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

        app.use(function (req, res, next) {
            res.locals.fullUrl = req.protocol + '://' + req.host + req.path;
            next();
        });

        app.use('/admin', function (req, res, next) {
            var err = req.session.error,
                msg = req.session.success;
            delete req.session.error;
            delete req.session.success;
            res.locals.logged = 'not logged';
            res.locals.message = '';
            if (err) {
                res.locals.message = '<div class="alert alert-danger">' + err + '</div>';
            }
            if (msg) {
                res.locals.message = '<div class="alert alert-success">' + msg + '</div>';
            }
            if (req.session.user) {
                res.locals.logged = 'logged';
            }
            next();
        });
        
        app.portNum = 3000;
        
        return app;
    };
}(exports, require));