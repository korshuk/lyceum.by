var express = require('express');
//var usage = require('usage');
var fs = require('fs');

module.exports = function (app) {
    'use strict';

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.reportController.report(req, res);      
    });
    router.post('/generate/:type', app.userController.Pass, function(req, res) {
        app.reportController.generate(req, res);      
    });

    router.get('/generated/:id', app.userController.Pass, function(req, res) {
        app.reportController.show(req, res);      
    });

    app.use('/admin/report', router);
};