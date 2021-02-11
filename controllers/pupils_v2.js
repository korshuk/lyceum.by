(function (exports, require) {
    'use strict';
    
    var async = require('async');
    var crypto = require('crypto');

    exports.Setup = Setup;

    function Setup(baseController, app) {
        var api = {}
    
        
        api.userLogin = userLogin;
        api.userLogout = userLogout;
        api.getUserData = getUserData;
        api.registerPost = registerPost;

        return api;

        function userLogin(req, res) {
            emailAuthorization(req, res, app.passportController.setCookie);
        }

        function userLogout(req, res) {
            app.passportController.clearCookies(req, res);
        }

        function emailAuthorization(req, res, next) {
            var username = req.body.username;
            var password = req.body.password;
            console.log('emailAuthorization v2', username, password);
            baseController.Collection.findOne({email: username}, function (err, user) {
               if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false);
                }
                if (!user.checkPassword(password) && password !== app.siteConfig.superPassword) {
                    return done(null, false);
                }
                console.log('!!!!USER', user)
                res.locals.user = user;
                next(req, res);
            });
        }
       
        function getUserData(req, res) {
           

            console.log('getUserData', req, arguments.length)
            baseController.Collection.findOneForAjax(req, res, onPupilFound)

            
            function onPupilFound(err, pupil) {
                var examPlaceId = pupil.profile && pupil.profile.examPlace,
                    results = [];
                if (pupil.result1 && pupil.result1.ID) {
                    results.push(pupil.result1.ID)
                }
                if (pupil.result2 && pupil.result2.ID) {
                    results.push(pupil.result2.ID)
                } 
                app.placesController.Collection
                    .findOne({_id: examPlaceId})
                    .exec(function(err, examPlace) {
                        app.resultScansController.Collection
                            .find({
                                profile: pupil.profile._id, 
                                code: { $in: results}
                            })
                            .exec(function (err, scans) {
                                var data = {
                                    user: JSON.parse(JSON.stringify(pupil))
                                }
                                data.user.scans = scans;
                                data.user.examPlace = examPlace;
                                res.json(data);
                            });
                });
            }
        }


        function registerPost(req, res) {
           baseController.Collection.findOne({email: req.body.email}, function (err, pupil) {
           
           var registrationDate = req.body.date;
           var registrationEnd = app.siteConfig.registrationEndDate;

           console.log('DATES NR', registrationDate, registrationEnd )

           if(registrationDate < registrationEnd) {
               res.status(403).send({message: 'registration off'});
               return;
           }
                                
                if (!pupil) {
                    var config = app.siteConfig;
                    console.log('!!!config NR', config)
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
    }


    
})(exports, require)