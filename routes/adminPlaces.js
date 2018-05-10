var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.placesController.list(req, res);
    });

    router.get('/create', app.userController.Pass, function(req, res) {
        app.placesController.create(req, res);
    });

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.placesController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        app.placesController.edit(req, res);
    });

    router.get('/showSeats/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.showSeats(req, res);
    });

    router.get('/:examNum/seats-email-export.csv', app.userController.Pass, function(req, res) {
        app.placesController.seatsEmailExport(req, res);
    });

    router.get('/hideSeats', app.userController.Pass, function(req, res) {
        app.placesController.hideSeats(req, res);
    });

    router.post('/', app.userController.Pass, function(req, res) {
        app.placesController.save(req, res);
    });

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.placesController.update(req, res);
    });

    app.use('/admin/pupils/places', router);
};