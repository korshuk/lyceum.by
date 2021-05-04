/*jslint node: true */
(function (exports, require) {
    'use strict';

    var mongoose = require('mongoose'),
        SubjectController = require('../controllers/subject').SubjectController,
        ProfileController = require('../controllers/profile').ProfileController,
        PlacesController = require('../controllers/place').PlacesController,
        PupilsController = require('../controllers/pupils').PupilsController,
        SotkaController = require('../controllers/stats_sotka').SotkaController;
        
    exports.configure = function (app) {
        app.subjectController = new SubjectController(mongoose, app);
        app.profileController = new ProfileController(mongoose, app);
        app.placesController = new PlacesController(mongoose, app);
        app.pupilsController = new PupilsController(mongoose, app);
        app.sotkaController = new SotkaController(mongoose, app);
        
        require('../routes/statsRoutes')(app);
        return app;
    };

}(exports, require));