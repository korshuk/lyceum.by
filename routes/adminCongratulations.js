module.exports = function (app) {
    'use strict';
    app.get('/admin/congratulations', app.userController.Pass, function (req, res) {
        app.congratulationsController.list(req, res);
    });
    app.get('/admin/congratulations/create', app.userController.Pass, function (req, res) {
        app.congratulationsController.create(req, res);
    });
    app.get('/admin/congratulations/delete/:id', app.userController.Pass, function (req, res) {
        app.congratulationsController.remove(req, res);
    });
    app.get('/admin/congratulations/edit/:id', app.userController.Pass, function (req, res) {
        app.congratulationsController.edit(req, res);
    });
    app.post('/admin/congratulations', app.userController.Pass, function (req, res) {
        app.congratulationsController.save(req, res);
    });
    app.put('/admin/congratulations/:id', app.userController.Pass, function (req, res) {
        app.congratulationsController.update(req, res);
    });
};