var express = require('express');

module.exports = function (app) {
    'use strict';

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.reportController.report(req, res);      
    });

    router.get('/show/:type', app.userController.Pass, function(req, res) {
        app.reportController.show(req, res);      
    });

    app.use('/admin/report', router);
};