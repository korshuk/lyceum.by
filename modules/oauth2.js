module.exports = function (app) {
    'use strict';

    var oauth2orize = require('oauth2orize');

    var server = oauth2orize.createServer();

    server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
        app.pupilsController.authorize.byEmail(client, username, password, scope, done);
    }));

    server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
        console.log('oauth2orize.exchange.refreshToken', client, refreshToken, scope);
        app.pupilsController.authorize.refreshToken(client, refreshToken, scope, done);
    }));

    return {
        token: [
            server.token(),
            server.errorHandler()
        ]
    }
};