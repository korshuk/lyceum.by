var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
            app.committeesController.list(req, res);
        });

    router.get('/create', app.userController.Pass, function(req, res) {
        app.committeesController.create(req, res);
    });

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.committeesController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        app.committeesController.edit(req, res);
    });

    router.post('/', app.userController.Pass, function(req, res) {
        app.committeesController.save(req, res);
    });

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.committeesController.update(req, res);
    });

    app.use('/admin/pupils/committees', router);
}