var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.profileController.list(req, res);
    });

    router.get('/create', app.userController.Pass, function(req, res) {
        app.profileController.create(req, res);
    });

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.profileController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        app.profileController.edit(req, res);
    });

    router.post('/', app.userController.Pass, function(req, res) {
        app.profileController.save(req, res);
    });

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.profileController.update(req, res);
    });

    app.use('/admin/pupils/profiles', router);
};