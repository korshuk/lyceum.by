module.exports = function (app) {

    'use strict';

    var path = require('path'),
        fs = require('fs'),
        gm = require('gm'),
        util = require('util');

    var localization = require('../modules/localization').localization;
    var passport = require('passport');
    var oauth2 = require('../modules/oauth2')(app);
    var passportStrategies = require('../modules/oauth')(app);
    var crypto = require('crypto');

    var ClientAppModel = require('../models/pupil').ClientAppModel;

    var HistoryModel = require('../models/pupil').HistoryModel;
    //var AccessTokenModel = require('../models/pupil').AccessTokenModel;
   // var RefreshTokenModel = require('../models/pupil').RefreshTokenModel;

    ClientAppModel.remove({}, function (err) {
        var client = new ClientAppModel({
            name: "OurService iOS client v1",
            clientId: "mobileV1",
            clientSecret: "abc123456"
        });
        client.save(function (err, client) {
            if (err) return log.error(err);
            else console.info("New client - %s:%s", client.clientId, client.clientSecret);
        });
    });
/*
    AccessTokenModel.remove({}, function (err) {
        if (err) return console.error(err);
    });
    RefreshTokenModel.remove({}, function (err) {
        if (err) return console.error(err);
    });
*/
    passportStrategies(passport);

    app.get('/api/pupils/images/:img', serveImg);

    app.use('/api/pupils/', passport.initialize());

    app.post('/api/oauth/token',
        passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
        oauth2.token);

    app.post('/api/oauth/requestPassword', requestPasswordPost);
    app.post('/api/pupils/register', registerPost);
    app.post('/reset/:token', resetPasswordPost);

    app.get('/api/pupils/userInfo',
        passport.authenticate('bearer', {session: false}),
        function(req,res) {
            app.pupilsController.getUserData(req,res);
        });

    app.get('/resetPassword/:token', resetPasswordPage);
    app.get('/registerConfirmation/:token', passport.initialize(), registerConfirmationPage);

    app.post('/api/pupils/fio', passport.authenticate('bearer', {session: false}), updateFio);
    app.post('/api/pupils/request', passport.authenticate('bearer', {session: false}), updateRequest);
    app.post('/api/pupils/diplom', passport.authenticate('bearer', {session: false}), updateDiplom);
    app.post('/api/pupils/additional', passport.authenticate('bearer', {session: false}), updateAdditional);
    app.post('/api/pupils/region', passport.authenticate('bearer', {session: false}), updateRegion);
    app.post('/api/pupils/profile', passport.authenticate('bearer', {session: false}), updateProfile);
    app.post('/api/pupils/profileready', passport.authenticate('bearer', {session: false}), profileReady);
    app.post('/api/pupils/password', passport.authenticate('bearer', {session: false}), updatePassword);

    function requestPasswordPost(req, res) {
        app.pupilsController.Collection.findOne({
                email: req.body.mail
            },
            function (err, pupil) {
                if (err) {
                    return res.send({
                        error: 'error'
                    });
                }
                if (!pupil) {
                    return res.send({
                        error: 'user not found'
                    });
                }

                var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";
                var pass = "";

                for (var x = 0; x < 10; x++) {
                    var i = Math.floor(Math.random() * chars.length);
                    pass += chars.charAt(i);
                }

                pupil.password = pass;
                pupil.save(function (err, pupil) {
                    app.mailController.mailPassRequest(pupil.email, pupil.password);
                    res.send('Email Sent');
                })
            });
    }

    function registerPost(req, res) {
        app.pupilsController.Collection.findOne({email: req.body.email}, function (err, pupil) {
            if (!pupil) {
                var pupil = new app.pupilsController.Collection({
                    password: req.body.password,
                    email: req.body.email,
                    status: 'new clear',
                    confirmMailToken: crypto.randomBytes(32).toString('hex')
                });

                pupil.save(function (err, pupil) {
                    if (err) {
                        res.status(403);
                        res.send({
                            message: 'something wrong'
                        });
                    }
                    else {
                        app.mailController.mailRegisterConfirm(pupil.email, 'http://' + req.headers.host + '/registerConfirmation/' + pupil.confirmMailToken);
                        res.send({
                            message: 'registered'
                        });
                    }
                });

            } else {
                res.status(403);
                res.send({
                    message: 'email exists'
                });
            }
        })
    }

    function resetPasswordPage(req, res) {
        console.log('get', req.params);

        app.pupilsController.Collection.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {$gt: Date.now()}
        }, function (err, pupil) {
            console.log('get2', pupil);
            if (!pupil) {
                return res.redirect('/forgot'); //invalid token
            }
            res.render('reset', {
                pupil: pupil
            });
        });
    }

    function registerConfirmationPage(req, res) {
        console.log('registerConfirmation', req.params);
        //TODO do we need expiration date?
        app.pupilsController.Collection.findOne({confirmMailToken: req.params.token}, function (err, pupil) {
            console.log('registerConfirmation2', pupil);
            if (!pupil) {
                return res.redirect('/abiturientu.html'); //TODO invalid token
            }
            if (pupil.status && pupil.status !== 'approved') {
                pupil.status = 'new';
            }
            pupil.confirmMailToken = null;

            pupil.save(function () {

                ClientAppModel.findOne({clientId: 'mobileV1'}, function (err, client) {

                    var tokenObj = app.pupilsController.authorize.tokensReset(pupil, client, function (err) {
                        console.log(err);
                    });

                    app.pupilsController.authorize.saveToken(tokenObj, pupil, function (err, access_token, refresh_token) {
                        console.log(arguments);
                        res.render('registerConfirmation', {
                            access_token: access_token,
                            refresh_token: refresh_token,
                            pupil: pupil
                        });
                    });
                });


            });

        });
    }

    function resetPasswordPost(req, res) {
        console.log('post', req.params);
        app.pupilsController.Collection.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {$gt: Date.now()}
        }, function (err, pupil) {
            console.log('post', pupil);
            if (!pupil) {
                return res.redirect('back'); //invalid token
            }

            pupil.password = req.body.password;
            pupil.resetPasswordToken = undefined;
            pupil.resetPasswordExpires = undefined;

            pupil.save(function (err) {
                res.redirect('/');
                //TODO redirect to massage & send email
                /* req.logIn(user, function(err) {
                 done(err, user);
                 });*/
            });
        });
    }

    function savePupil(res, err, pupil) {
        console.log('saved pupil', pupil);
        if (err) {
            res.send({
                message: 'error' + err
            });
        } else {
            res.send({
                message: 'ok',
                pupil: pupil
            });
        }
    }

    function updateFio(req, res) {
        console.log(req);
        var pupil = req.user;
        //TODO add trim whitespace
        pupil.firstName = req.body.firstName;
        pupil.lastName = req.body.lastName;
        pupil.parentName = req.body.parentName;

        pupil.save(function (err, pupil) {
            savePupil(res, err, pupil);
        });
    }

    function updateAdditional(req, res) {
        var pupil = req.user;
        pupil.night = req.body.night;
        pupil.distant = req.body.distant;
        pupil.save(function (err, pupil) {
            savePupil(res, err, pupil);
        });
    }

    function updateRegion(req, res) {
        var pupil = req.user;
        pupil.region = req.body.region;
        pupil.save(function (err, pupil) {
            savePupil(res, err, pupil);
        });
    }

    function profileReady(req, res) {
        var pupil = req.user;
        pupil.status = 'unapproved';
        pupil.message = '';
        pupil.requestImgNotApproved = false;
        pupil.requestImgNoPhoto = false;
        pupil.requestImgLowQuality = false;
        pupil.requestImgStampError = false;
        pupil.diplomImgNotApproved = false;
        console.log('requestSend', pupil);
        pupil.save(function (err, pupil) {
            savePupil(res, err, pupil);
        });
    }

    function updateProfile(req, res) {
        var pupil = req.user;
        var oldNeedBel = pupil.needBel;
        pupil.needBel = req.body.needBel;
        app.profileController.Collection.findOne({_id: pupil.profile}, function (err, profile) {
            app.profileController.Collection.findOne({_id: req.body.profile}, function (err, pupilProfile) {
                //TODO check pupil status
                if (!profile) {
                    profile = {
                        count: 0,
                        id: 0,
                        save: function (next) {
                            next();
                        }
                    }
                }
                if (profile.id !== pupilProfile.id) {
                    pupil.profile = pupilProfile.id;
                }

                if (pupil.status === 'approved') {
                    if (pupil.diplomImg) {
                        if (pupilProfile.olympExams.indexOf(pupil.diplomExamName) > -1) {
                            pupil.passOlymp = true;
                            pupil.exam1 = -1;
                            pupil.exam2 = -1;
                            pupil.sum = -1;
                        } else {
                            pupil.passOlymp = false;
                            pupil.exam1 = 0;
                            pupil.exam2 = 0;
                            pupil.sum = 0;
                        }
                    }
                }


                profile.save(function (err) {
                    pupilProfile.save(function (err) {
                        pupil.save(function (err, pupil) {
                            var history = new HistoryModel({
                                pupil: pupil._id,
                                message: "profile from <b>" +  profile.name + '</b> to <b>' + pupilProfile.name + '</b>, and bel from <b>' + oldNeedBel + '</b> to <b>' + pupil.needBel + '</b>',
                            });
                            history.save(function (err, history) {
                                console.log('pupil change', history);
                            });

                            savePupil(res, err, pupil);
                        });
                    });
                });
            });
        });
    }

    function updateDiplom(req, res) {
        var pupil = req.user;
        console.log('req.files', req.body);
        if (req.body && req.body.attachment && req.body.attachment.empty === 'true') {
            pupil.diplomImg = null;
            pupil.diplomImgNotApproved = false;
            pupil.diplomExamName = null;

            pupil.save(function (err, pupil) {
                savePupil(res, err, pupil);
            });
        } else {
            var filename = Date.now() + '-' + req.files.attachment.file.originalFilename;

            gm(req.files.attachment.file.path)
                .quality(80)
                .resize(800)
                .write('./public/images/pupils/' + filename, function (err) {
                    if (!err) {
                        pupil.diplomImg = filename;
                        pupil.diplomImgNotApproved = false;
                        pupil.save(function (err, pupil) {
                            savePupil(res, err, pupil);
                        });
                        fs.unlink(req.files.attachment.file.path, function (err) {
                            if (err) console.log('unlink error ' + err);
                        });
                    }
                    else {
                        //TODO error handel
                        console.log('desktop error ' + err);
                    }
                });
        }
    }

    function updateRequest(req, res) {
        var pupil = req.user;

        var filename = Date.now() + '-' + req.files.attachment.file.originalFilename;

        gm(req.files.attachment.file.path)
            .quality(80)
            .resize(800)
            .write('./public/images/pupils/' + filename, function (err) {
                if (!err) {
                    pupil.requestImg = filename;
                    pupil.requestImgNotApproved = false;
                    pupil.requestImgNoPhoto = false;
                    pupil.requestImgLowQuality = false;
                    pupil.requestImgStampError = false;
                    pupil.save(function (err, pupil) {
                        savePupil(res, err, pupil);
                    });
                    fs.unlink(req.files.attachment.file.path, function (err) {
                        if (err) console.log('unlink error ' + err);
                    });
                }
                else {
                    //TODO error handel
                    console.log('desktop error ' + err);
                }
            });
    }

    function updatePassword(req, res) {
        var pupil = req.user;
        pupil.password = req.body.password;
        pupil.save(function (err, pupil) {
            savePupil(res, err, pupil);
        })
    }

    function serveImg(req, res) {
        var mime = {
            gif: 'image/gif',
            jpg: 'image/jpeg',
            png: 'image/png'
        };
        var file = './images/pupils/' + req.params.img;
        var type = mime[path.extname(file).slice(1)] || 'text/plain';
        var s = fs.createReadStream(file);
        s.on('open', function () {
            res.set('Content-Type', type);
            s.pipe(res);
        });
        s.on('error', function (err) {
            console.log('fileerror', err);
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
        });
    }
};
