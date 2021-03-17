var PassportController = function(app) {
    'use strict';
    var express = require('express');
    var passport = require('passport');
    var JWTStrategy = require('passport-jwt').Strategy;
    var cors = require('cors');
    var cookieParser = require('cookie-parser');
    var jwt = require('jsonwebtoken');
    var https = require("https");

    var CORS_OPTIONS = {
        origin: ['http://localhost:8081', 'http://localhost:8080'],
        credentials: true,
        exposedHeaders: ['Set-Cookie']
    }
    
    var GOGLE_RECAPTCHA_REQUEST_OPTIONS = {
        host: 'www.google.com',
        port: 443,
        path: '/recaptcha/api/siteverify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    app.v2Config = {
        JWT_EXPIRATION_TIME: 600000,
        JWT_SECRET: 'wow123'
    }

    this.recaptchaCheck = recaptchaCheck;
    this.authenticate = authenticateMiddlware;
    this.init = init;
    this.clearCookies = clearCookies;
    this.setCookie = setCookie;
    this.sendCookiedRes = sendCookiedRes;
        
    function init(router) {
        setUpStrategies();
        router.use(passport.initialize());
        router.use(cookieParser(app.v2Config.JWT_SECRET));
        router.use(cors(CORS_OPTIONS));
        router.use(express.urlencoded({ extended: true }))
    }

    function recaptchaCheck(req, res, next) {
        makeGoogleRequest(app.siteConfig.reCaptchaSecret, req.body.recapchaToken, next, onRecaptchaError);

        function onRecaptchaError(error) {
            res.status(403).json(error)
        }
        
    }

    function makeGoogleRequest(secret, token, onSuccess, onError) {
        var options = JSON.parse(JSON.stringify(GOGLE_RECAPTCHA_REQUEST_OPTIONS));
        options.path = options.path + "?secret=" + secret + "&response=" + token;
        
        var googleRequest = https.request(options, onGoogleResponse);
        googleRequest.on('error', onGoogleError);
        googleRequest.end();

        function onGoogleError(error) {
            onError({
                type: 'RECAPTCHA_ERROR',
                message: 'RECAPTCHA_NETWORK_ERROR',
                error: error
            })
        }

        function onGoogleResponse(googleResponse){
            var output = '';
            googleResponse.setEncoding('utf8');

            googleResponse.on('data', function (chunk) {
                output += chunk;
            });

            googleResponse.on('end', function() {
                var obj = JSON.parse(output);
                console.log('google responce', obj)
                if (obj.success === true) {
                    onSuccess()
                } else {
                    onError({
                        type: 'RECAPTCHA_ERROR',
                        message: 'RECAPTCHA_IVALID_CHECK'
                    })
                }
            });
        }
    }

    function clearCookies(req, res) {
        if (req.cookies['jwt']) {
            res
                .clearCookie('jwt')
                .status(200)
                .json({
                    message: 'You have logged out'
                })
        } else {
            res.status(401).json({
                error: 'Invalid cookie token'
            })
        }
    }

    function setCookie(req, res) {
        var payload = {
            userId: res.locals.user._id,
            expiration: Date.now() + parseInt(app.v2Config.JWT_EXPIRATION_TIME)
        }

        var token = jwt.sign(JSON.stringify(payload), app.v2Config.JWT_SECRET);
        console.log('token', token)
        res
            .cookie('jwt',
                token, {
                    httpOnly: true,
                    secure: false //--> TODO SET TO TRUE ON PRODUCTION
                }
            )
            .status(200)
            .json({
                message: 'You have logged in :D'
            })
    }

    function sendCookiedRes(req, res, data) {
        var payload = {
            userId: req.user.userId,
            expiration: Date.now() + parseInt(app.v2Config.JWT_EXPIRATION_TIME)
        }
        var token = jwt.sign(JSON.stringify(payload), app.v2Config.JWT_SECRET);
        
        res
            .cookie('jwt',
                token, {
                    httpOnly: true,
                    secure: false //--> TODO SET TO TRUE ON PRODUCTION
                }
            )
            .status(200)
            .json(data)
    }

    function setUpStrategies() {
        var jwtStrategy = new JWTStrategy({
                jwtFromRequest: cookieExtractor,
                secretOrKey: app.v2Config.JWT_SECRET
            }, jwtStrategyCallback);
        
        passport.use('jwt', jwtStrategy)
    }

    function authenticateMiddlware(req, res, next) {
        passport.authenticate('jwt', {session: false }, function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.json(info); }
            console.log('################', user)
            req.logIn(user, function(err) {
                req.user = user
                next();
            });
        })(req, res, next);
    }

    function jwtStrategyCallback(jwtPayload, done) {
        var expiration = jwtPayload.expiration
        if (Date.now() > expiration) {
            return done(null, false, { message: 'session expired'})
        } else {
            return done(null, jwtPayload)
        }
    }

    function cookieExtractor(req) {
        var jwt = null 
        if (req && req.cookies) {
            jwt = req.cookies['jwt']
        }
        return jwt
    }
}

exports.PassportController = PassportController;