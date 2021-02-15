var express = require('express');
var session = require('express-session');


var SESSION_OPTIONS = {
    secret: 'wow very secret',
    cookie: {
      maxAge: 600000,
      secure: true
    },
    saveUninitialized: false,
    resave: false,
    unset: 'destroy'
}

module.exports = function (app) {
    'use strict';
    
    var router = express();
    
    app.passportController.init(router);
    
    router.post('/login', 
        app.passportController.recaptchaCheck,
        function(req, res) { app.pupilsController.v2.userLogin(req, res) }
    );

    router.post('/logout',
        app.passportController.authenticate,
        function(req, res) { app.pupilsController.v2.userLogout(req, res) }
    );

    router.post('/pupils/register',  function(req, res) {
       app.pupilsController.v2.registerPost(req, res) }
    )
    


    router.get('/pupils/current',
        app.passportController.authenticate,
        function(req, res) { app.pupilsController.v2.getUserData(req, res) }
    );
    
    router.get('/config/current',
        function(req, res) { app.settingsController.v2.getCurrent(req, res) }
    );    

    router.post('/oauth/requestPassword', function(req, res) {
        app.pupilsController.v2.requestPasswordPost(req, res) }
     )


    app.use('/api/v2', router);
};
