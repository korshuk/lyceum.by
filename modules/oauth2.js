module.exports = function (app) {
    'use strict';

    var oauth2orize = require('oauth2orize');

    var server = oauth2orize.createServer();
    var server_v2 = oauth2orize.createServer();

    server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
        app.pupilsController.authorize.byEmail(client, username, password, scope, done);
    }));

    server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
        console.log('oauth2orize.exchange.refreshToken', client, refreshToken, scope);
        app.pupilsController.authorize.refreshToken(client, refreshToken, scope, done);
    }));

    server_v2.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
        app.pupilsController.authorize_v2.byEmail(client, username, password, scope, done);
    }));

    server_v2.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
        app.pupilsController.authorize_v2.refreshToken(client, refreshToken, scope, done);
    }));

    return {
        token: [
            server.token(),
            server.errorHandler()
        ],
        token_v2: [
            server_v2.token(),
            server_v2.errorHandler()
        ]
    }
};