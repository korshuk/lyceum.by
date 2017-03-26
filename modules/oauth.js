module.exports = function (app) {
    'use strict';
    var BasicStrategy = require('passport-http').BasicStrategy;
    var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
    var BearerStrategy = require('passport-http-bearer').Strategy;

    return passportStrategies;

    function passportStrategies(passport) {
        passport.use(new BasicStrategy(
            function (username, password, done)  {
                app.pupilsController.strategies.BasicStrategy(username, password, done)
            }));

        passport.use(new ClientPasswordStrategy(
            function (clientId, clientSecret, done) {
                app.pupilsController.strategies.ClientPasswordStrategy(clientId, clientSecret, done)
            }));

        passport.use(new BearerStrategy(
            function (accessToken, done) {
                app.pupilsController.strategies.BearerStrategy(accessToken, done);
            }
        ));
    }
};