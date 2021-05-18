/*jslint node: true */
(function () {
    'use strict';
    var path = require('path');
    var app = {};
    
    global.rootDir = path.resolve(__dirname);
    
    app = require('./application/pupil_config.js').configure(app);

    app = require('./application/pupil_routsConfig.js').configure(app);

    setTimeout(function () {
        app.use(function (err, req, res, next) {
            console.log('err', err);
            res.redirect('404.html');
        });
        if (!module.parent) {
            app.listen(app.portNum);
        }
        console.log('current pupil app started at port', app.portNum);
    }, 6000);
}());
