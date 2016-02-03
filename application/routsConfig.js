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
        FileController = require('../controllers/file').FileController;
        ExamsController = require('../controllers/exams').ExamsController;

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

        require('../routes/frontRoutes')(app);

        app.menuController = new MenuController(app);
        app.userController = new UserController(mongoose);
        app.pageController = new PageController(mongoose, app);
        app.examsController = new ExamsController(mongoose);

        require('../routes/adminRoutes')(app);
        return app;
    };

}(exports, require));