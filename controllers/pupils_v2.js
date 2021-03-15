(function (exports, require) {
    'use strict';
    
    var async = require('async'),
        crypto = require('crypto'),
        mongoose = require('mongoose');

    exports.Setup = Setup;

    function Setup(baseController, app) {
        var api = {}
    
        
        api.userLogin = userLogin;
        api.userLogout = userLogout;
        api.getUserData = getUserData;
        api.userRegister = userRegister;
        api.requestPasswordPost = requestPasswordPost;
        api.userUpdate = userUpdate;
        api.uploadPhoto = uploadPhoto;
        api.getRequestPhoto = getRequestPhoto;
        api.sendSMS = sendSMS;
        api.checkSMSCode = checkSMSCode;

        var pupilUpdater = {
            'profile': updateProfile,
            'enrollChange': updateEnroll,
            'fio': updateFIO,
            'region': updateRegion,
            'requestimg': updateRequestImg,
            'diplomImg': updateDiplomImg,
            'diplomImgDelete': deleteDiplomImg,
            'additional': updateAdditional,
            'phone': updatePhone,
            'sendRequest': updateUserStatus
        }
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
       
        function userUpdate(req, res) {

            baseController.Collection.findOne({ _id: req.user.userId}, onPupilFound)

            function onPupilFound(err, pupil) {
                if (err) {
                    res.json(err);
                } else {
                    if (!pupilUpdater[req.body.apiAction]) {
                        res.status(500).send({
                            message: 'something wrong'
                        })
                    } else {
                        pupilUpdater[req.body.apiAction](pupil, req.body.user, function(err, pupil) {
                            if (err) {
                                res.status(500).send({
                                    message: 'something wrong on save'
                                })
                            } else {
                                res.send('Ok')
                            }
                            
                        });
                    }
                    
                }
            }
        }

        function updatePhone(pupil, newData, next) {
            next(null, pupil)
        }

        function updateUserStatus(pupil, newData, next) {
            pupil.agreement = newData.agreement;
            pupil.status = 'unapproved';
            pupil.message = '';
            pupil.requestImgNotApproved = false;
            pupil.requestImgNoPhoto = false;
            pupil.requestImgLowQuality = false;
            pupil.requestImgStampError = false;
            pupil.diplomImgNotApproved = false;
            pupil.save(function (err, pupil) {
                next(err, pupil)
            });
        }

        function updateAdditional(pupil, newData, next) {
            // TODO check status and date
            // if (pupil.status !== 'approved') {
                //TODO add trim whitespace

                pupil.night = newData.night;
                pupil.distant = newData.distant;
                pupil.save(function (err, pupil) {
                    next(err, pupil)
                });
            // } else {
            //     next('save not allowed', null)
            // }
        }

        function updateFIO(pupil, newData, next) {
            // TODO check status and date
            // if (pupil.status !== 'approved') {
                //TODO add trim whitespace
                var firstName = newData.firstName.trim();
                var lastName = newData.lastName.trim();
                var parentName = newData.parentName.trim();
                firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
                lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1)
                parentName = parentName.charAt(0).toUpperCase() + parentName.slice(1)
                
                pupil.firstName = firstName;
                pupil.lastName = lastName;
                pupil.parentName = parentName;

                pupil.save(function (err, pupil) {
                    next(err, pupil)
                });
            // } else {
            //     next('save not allowed', null)
            // }
        }

        function updateRegion(pupil, newData, next) {
            // TODO check status and date
            // if (pupil.status !== 'approved') {
                //TODO add trim whitespace

                pupil.region = newData.region;
                pupil.save(function (err, pupil) {
                    next(err, pupil)
                });
            // } else {
            //     next('save not allowed', null)
            // }
        }

        function updateRequestImg(pupil, newData, next) {
            pupil.requestImg = newData.requestImg;
            pupil.requestImgNotApproved = false;
            pupil.requestImgNoPhoto = false;
            pupil.requestImgLowQuality = false;
            pupil.requestImgStampError = false;
            pupil.save(function (err, pupil) {
                next(err, pupil)
            });
        }

        function updateDiplomImg(pupil, newData, next) {
            pupil.diplomImg = newData.diplomImg;
            pupil.diplomImgNotApproved = false;
            pupil.diplomExamName = null;
            pupil.diplomProfile = newData.diplomProfile._id;
            pupil.passOlymp = false;
            pupil.save(function (err, pupil) {
                next(err, pupil)
            });
        }

        function deleteDiplomImg(pupil, newData, next) {
            pupil.diplomImg = null;
            pupil.diplomImgNotApproved = false;
            pupil.diplomExamName = null;
            pupil.diplomProfile = null
            pupil.passOlymp = false;
            pupil.save(function (err, pupil) {
                next(err, pupil)
            });
        }

        function updateEnroll(pupil, newData, next) {
            pupil.isEnrolledToExams = !!newData.isEnrolledToExams;
            pupil.save(function (err, pupil) {
                next(err, pupil)
            });
        }

        function updateProfile(pupil, newData, next) {
            var profile = pupil.profile || { id: 0 };
            var oldNeedBel = pupil.needBel;
            pupil.needBel = newData.needBel;
            if (newData.profile && newData.profile._id) {
                app.profileController.Collection.findOne({_id: newData.profile._id}, function (err, newProfile) {
                    //TODO check pupil status    
                    if (profile.id !== newProfile.id) {
                        pupil.profile = newProfile.id;
                    }

                    var additionalProfiles = [];
                    var additionalProfile;
                    for (var i = 0; i < newData.additionalProfiles.length; i++) {
                        additionalProfile = newData.additionalProfiles[i]
                        additionalProfiles.push(additionalProfile._id)
                        
                    }

                    pupil.additionalProfiles = additionalProfiles

                    if (pupil.status === 'approved') {
                        if (pupil.diplomImg) {
                            if (newProfile.olympExams.indexOf(pupil.diplomExamName) > -1) {
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
                    pupil.save(function (err, pupil) {
                        next(err, pupil)
                    });
                });
            } else {
                pupil.save(function (err, pupil) {
                    next(err, pupil)
                });
            }
        }

        function checkSMSCode(req, res) {
            baseController.Collection.findOne({ _id: req.user.userId}, onPupilFound)

            function onPupilFound(err, pupil) {
                if (err) {
                    res.json(err);
                } else {
                    var code = req.body.code;
                    pupil.codeValid =  (code === pupil.phoneCode) || (code === app.siteConfig.smsAPISecretCode);
            
                    pupil.save(function (err, pupil) {
                        res.send({
                            isValid: pupil.codeValid
                        })
                    })
                }
            }
        }

        function sendSMS(req, res) {
            baseController.Collection.findOne({ _id: req.user.userId}, onPupilFound)

            function onPupilFound(err, pupil) {
                if (err) {
                    res.json(err);
                } else {
                    

                    pupil.phone = req.body.phone;
                    pupil.phoneCode =  Math.floor(100000 + Math.random() * 900000);
                    pupil.codeValid = false;

                    app.smsController.sendVerificationCode(pupil.phone, pupil.phoneCode);

                    pupil.save(function (err, pupil) {
                        res.send('OK')
                    })
                    
                }
            }
        }

        function getUserData(req, res) {
            baseController.Collection.findOneForAjax(req, res, onPupilFound)

            function onPupilFound(err, pupil) {
                console.log(err, pupil)
                if (!pupil) {
                    res.status(500).send({
                        message: 'user not found'
                    })
                } else {
                    var examPlaceId = pupil.profile && pupil.profile.examPlace,
                        results = [],
                        data = {
                            user: JSON.parse(JSON.stringify(pupil))
                        }
                    if (!examPlaceId) {
                        res.json(data);
                        return;
                    } else {
                        results = createResultsArray(pupil);

                        app.placesController.Collection
                            .findByExamPlaceId(examPlaceId)
                            .exec(function(err, examPlace) {
                                data.user.examPlace = examPlace;
                                if (results.length === 0) {
                                    res.json(data);
                                }
                                else {
                                    app.resultScansController.Collection
                                        .find({
                                            profile: pupil.profile._id, 
                                            code: { $in: results}
                                        })
                                        .exec(function (err, scans) {
                                            
                                            data.user.scans = scans;
                                            
                                            res.json(data);
                                        });
                                }
                        });
                    }
                }
            }
        }


        function userRegister(req, res) {
           baseController.Collection.findOne({email: req.body.user.email}, function (err, pupil) {
           
           var dateNow = new Date;
           var dateRegistrationEnd = app.siteConfig.registrationEndDate;

           console.log('DATES NR', dateNow.getTime(), dateRegistrationEnd.getTime() )

           if(dateNow.getTime() > dateRegistrationEnd.getTime()) {
               res.status(403).send({message: 'registration off'});
               return;
           }
                                
                if (!pupil) {
                    var pupil = new app.pupilsController.Collection({
                        password: req.body.user.password,
                        email: req.body.user.email,
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

        function createResultsArray(pupil) {
            var results = [];
            if (pupil.result1 && pupil.result1.ID) {
                results.push(pupil.result1.ID)
            }
            if (pupil.result2 && pupil.result2.ID) {
                results.push(pupil.result2.ID)
            } 
            return results
            
            
        }
        function getRequestPhoto(req, res) {
            app.s3filesController.getRequestPhoto(req, res) 
        }
        function uploadPhoto(req, res) {            
            app.s3filesController.uploadRequestPhoto(req, res)
        }
    }
    
    

    
})(exports, require)