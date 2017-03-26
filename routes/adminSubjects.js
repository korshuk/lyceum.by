var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
            app.subjectController.list(req, res);
        });

    router.get('/create', app.userController.Pass, function(req, res) {
        app.subjectController.create(req, res);
    });

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.subjectController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        app.subjectController.edit(req, res);
    });

    router.post('/', app.userController.Pass, function(req, res) {
        app.subjectController.save(req, res);
    });

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.subjectController.update(req, res);
    });

    app.use('/admin/pupils/subjects', router);
}