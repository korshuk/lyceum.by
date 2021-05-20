//var usage = require('usage');
var fs = require('fs');
var http = require('http');

module.exports = function (app) {
    'use strict';
    app.get('/admin/cash', app.userController.Pass, function (req, res) {
        var props = Object.getOwnPropertyNames(app.superCash),
            docs = [],
            array = fs.readFileSync('start-times.log').toString().split("\n");
       /* usage.lookup(process.pid, {
            keepHistory: true
        }, function (err, result) {
            if (err) {
                result = err;
            }
           
        });*/
        var result = ' ';
        props.forEach(function (name) {
            docs.push({
                name: name,
                updatedAt: app.superCash[name].updatedAt,
                counter: app.superCash[name].counter,
                addedToCash: app.superCash[name].addedToCash
            });
        });
        res.render('cash/list.jade', {
            result: result,
            docs: docs,
            starts: array,
            viewName: 'cash'
        });


    });
    app.get('/admin/cash/deleteAll', app.userController.Pass, function (req, res) {
        app.superCash = {};
        res.redirect('/admin/cash');
    });
    app.get('/admin/cash/resetPupilApp', app.userController.Pass, function (req, res) {
        
        http.get("http://127.0.0.1:3060/resetCache", function(response) {
            console.log("Got response: " + response.statusCode);
            
            var data = '';
            response.on('data', function (chunk) {
                data += chunk;
            });
            
            response.on('end', function () {
                res.redirect('/admin/cash');
            });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    });
    
    app.get('/admin/cash/:name/delete', app.userController.Pass, function (req, res) {
        delete app.superCash[req.params.name];
        res.redirect('/admin/cash');
    });
};