var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
            app.pupilMessageController.list(req, res);
        });

    router.get('/create', app.userController.Pass, function(req, res) {
        app.pupilMessageController.create(req, res);
    });

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.pupilMessageController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        app.pupilMessageController.edit(req, res);
    });

    router.post('/', app.userController.Pass, function(req, res) {
        app.pupilMessageController.save(req, res);
    });

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.pupilMessageController.update(req, res);
    });

    app.use('/admin/pupils/pupilMessages', router);
}