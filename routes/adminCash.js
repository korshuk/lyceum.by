module.exports = function (app) {
    'use strict';
    app.get('/admin/cash', app.userController.Pass, function (req, res) {
        var props = Object.getOwnPropertyNames(app.superCash),
            docs = [];
        props.forEach(function (name) {
            docs.push({
                name: name,
                updatedAt: app.superCash[name].updatedAt,
                counter: app.superCash[name].counter,
                addedToCash: app.superCash[name].addedToCash
            });
        });
        res.render('cash/list.jade', {
            docs: docs
        });
    });
    app.get('/admin/cash/deleteAll', app.userController.Pass, function (req, res) {
        app.superCash = {};
        res.redirect('/admin/cash');
    });
    app.get('/admin/cash/:name/delete', app.userController.Pass, function (req, res) {
        delete app.superCash[req.params.name];
        res.redirect('/admin/cash');
    });
};