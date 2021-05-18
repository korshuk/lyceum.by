/*jslint node: true */
(function (exports, require) {
    'use strict';

    var mongoose = require('mongoose'),
        CurrentPupilController = require('../controllers/pupils_current').PupilsController,
        SubjectController = require('../controllers/subject').SubjectController,
        // ProfileController = require('../controllers/profile').ProfileController,
        PlacesController = require('../controllers/place').PlacesController,
        ResultScansController = require('../controllers/resultScans').ResultScansController,
        // PupilsController = require('../controllers/pupils').PupilsController,
        SotkaController = require('../controllers/sotka').SotkaController;
        
    exports.configure = function (app) {
        
        app.subjectController = new SubjectController(mongoose, app);
        // app.profileController = new ProfileController(mongoose, app);
        app.placesController = new PlacesController(mongoose, app);
        app.sotkaController = new SotkaController(mongoose, app);
        app.resultScansController = new ResultScansController(mongoose, app);
        app.currentPupilController = new CurrentPupilController(mongoose, app);
        
        require('../routes/pupilsRoutes')(app);
        return app;
    };

}(exports, require));