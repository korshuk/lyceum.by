/*jslint node: true */
(function (exports, require) {
    'use strict';

    var mongoose = require('mongoose'),
        NewsController = require('../controllers/news').NewsController,
        MediaController = require('../controllers/media').MediaController,
        CongratulationsController = require('../controllers/congratulations').CongratulationsController,
        UserController = require('../controllers/user').UserController,
        PageController = require('../controllers/page').PageController,
        MenuController = require('../controllers/menu').MenuController,
        ContactsController = require('../controllers/contacts').ContactsController,
        ResultsController = require('../controllers/results').ResultsController,
        FileController = require('../controllers/file').FileController,
        ExamsController = require('../controllers/exams').ExamsController,
        SettingsController = require('../controllers/settings').SettingsController,
        SubjectController = require('../controllers/subject').SubjectController,
        CommitteesController = require('../controllers/committees').CommitteesController,
        ProfileController = require('../controllers/profile').ProfileController,
        PlacesController = require('../controllers/place').PlacesController,
        PupilsController = require('../controllers/pupils').PupilsController,
        SotkaController = require('../controllers/sotka').SotkaController,
        MailController = require('../controllers/mail').MailController,
        smsController = require('../controllers/smsController').smsController,
        ReportController = require('../controllers/report').ReportController;

        
    exports.configure = function (app) {
        app.param('lang', function (req, res, next, lang) {
            var regex = new RegExp(/^(ru|by|en)$/);
            if (regex.test(lang)) {
                next();
                console.log('param true', lang);
            } else {
                next('route');
            }
        });

        app.fileController = new FileController(app);

        app.newsController = new NewsController(mongoose);
        app.mediaController = new MediaController(mongoose);
        app.congratulationsController = new CongratulationsController(mongoose);
        app.contactsController = new ContactsController(mongoose, app);
        app.resultsController = new ResultsController(mongoose, app);

        require('../routes/frontRoutes')(app);

        app.mailController = new MailController(mongoose, app);
        app.smsController = new smsController(mongoose, app);
        app.menuController = new MenuController(app);
        app.userController = new UserController(mongoose);
        app.pageController = new PageController(mongoose, app);
        app.examsController = new ExamsController(mongoose, app);
        app.settingsController = new SettingsController(mongoose, app);
        app.sotkaController = new SotkaController(mongoose, app);
        app.subjectController = new SubjectController(mongoose, app);
        app.committeesController = new CommitteesController(mongoose, app);
        app.profileController = new ProfileController(mongoose, app);
        app.placesController = new PlacesController(mongoose, app);
        app.pupilsController = new PupilsController(mongoose, app);
        app.reportController = new ReportController('Report', '', mongoose, app, true);

        require('../routes/adminRoutes')(app);
        return app;
    };

}(exports, require));