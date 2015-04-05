/*jslint node: true */
(function () {
    'use strict';
    var app = {},
        url = require('url'),
        fs = require('fs'),
        localization = require('./modules/localization').localization;

    app = require('./application/config.js').configure(app);

    app = require('./application/routsConfig.js').configure(app);

    app = require('./application/sendingPage.js').configure(app);

    setTimeout(function () {
        app.use(function (req, res) {
            console.log('app.js 17', req.params);
            res.redirect('404.html');
        });
        if (!module.parent) {
            var date = new Date();
            app.listen(app.portNum);
            fs.appendFile("start-times.log", date.toISOString() + '\n', function (err) {
                if (err) {
                    throw 'error writing file: ' + err;
                }
                console.log('file written');
            });

        }
        console.log('started');
    }, 5000);
}());