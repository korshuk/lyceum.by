var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.placesController.list(req, res);
    });

    router.get('/seedApp/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.seedaAppPage(req, res);
    });
             //   /admin/pupils/examseeds/seedApp/api/dictionary
    router.get('/seedApp/api/dictionary', app.userController.Pass, function(req, res) {
        app.placesController.getDictionary(req, res);
    });
    router.get('/seedApp/api/corpses/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.getCorpses(req, res);
    });
    router.get('/seedApp/api/generateStatus', app.userController.Pass, function(req, res) {
        app.placesController.getGenerateStatus(req, res);
    });
    router.get('/seedApp/api/generate', app.userController.Pass, function(req, res) {
        app.placesController.generatePupilSeeds(req, res);
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

    app.use('/admin/pupils/examseeds', router);
};