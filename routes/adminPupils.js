var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.pupilsController.list(req, res);
    });

    router.get('/api/list', app.userController.Pass, function(req, res) {
        app.pupilsController.apiList(req, res);
    });

    router.get('/history', app.userController.Pass, function(req, res) {
        app.pupilsController.historyList(req, res);
    });

    //router.get('/create', app.userController.Pass, function(req, res) {
    //    app.profileController.create(req, res);
    //});

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.pupilsController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        console.log('edit', req.params.id, req.query);
        app.pupilsController.edit(req, res);
    });

    router.post('/edit/:id', app.userController.Pass, function(req, res) {
        console.log('post pupil save', req.params.id, req.query, req.body);
        app.pupilsController.changeStatus(req, res);
    });

   // router.post('/', app.userController.Pass, function(req, res) {
    //    app.profileController.save(req, res);
    //});

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.pupilsController.update(req, res);
    });

    app.use('/admin/pupils', router);
};