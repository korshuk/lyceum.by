var express = require('express');

module.exports = function(app) {

    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.placesController.list(req, res);
    });

    router.get('/seedApp/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.seedaAppPage(req, res);
    });
    router.get('/seedApp/lists/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.seedList(req, res);
    });
    router.get('/seedApp/print/:examNum/:corpsAlias.html', app.userController.Pass, function(req, res) {
        app.placesController.seedListPrint(req, res);
    });
    router.get('/seedApp/csvexport/:examNum/:filename.csv', app.userController.Pass, function(req, res) {
        app.placesController.csvExport(req, res);
    });
    
             //   /admin/pupils/examseeds/seedApp/api/dictionary
    router.get('/seedApp/api/dictionary', app.userController.Pass, function(req, res) {
        app.placesController.getDictionary(req, res);
    });
    router.get('/seedApp/api/corpses/:examNum', app.userController.Pass, function(req, res) {
        var exumNum = req.params.examNum;
        app.placesController.getCorpses(exumNum, function(corpses) {
            res.json(corpses);
        });
    });
    router.get('/seedApp/api/generateStatus/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.getGenerateStatus(req, res);
    });
    router.get('/seedApp/api/generate/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.generatePupilSeeds(req, res);
    });
    router.get('/seedApp/api/pupils/:examNum', app.userController.Pass, function(req, res) {
        var exumNum = req.params.examNum;
        var query = req.query;
        var corpsQuery = query.corps;
        app.placesController.getPupilsForCorps(exumNum, corpsQuery, function(data) {
            res.json(data)
        });
    })
    
    router.get('/seedApp/api/enable/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.cnangeSeedVisibleState(req, res, true);
    })

    router.get('/seedApp/api/disable/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.cnangeSeedVisibleState(req, res, false);
    })
    router.get('/seedApp/api/enableAuditorium/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.cnangeSeedVisibleAuditoriumState(req, res, true);
    })
    router.get('/seedApp/api/disableAuditorium/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.cnangeSeedVisibleAuditoriumState(req, res, false);
    })
    

    router.post('/seedApp/api/changeaudience/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.changeAudience(req, res);
    });
    
    router.post('/seedApp/api/savecurrentseats/:examNum', app.userController.Pass, function(req, res) {
        app.placesController.saveCurrentSeats(req, res);
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