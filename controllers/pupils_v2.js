var fs = require('fs'),
    http = require('http');

var GET_USER_DATA_REQUEST_OPTIONS = {
    hostname: '127.0.0.1',
    port: 3060,
    path: '/getUserObject',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        //'Content-Length': Buffer.byteLength(JSON.stringify(pupil)) 
    }
};    

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
        api.getScanFile = getScanFile;
        api.keyFile = keyFile;

        api.showAdmissionPage = showAdmissionPage;
        api.getApprovedForAdmission = getApprovedForAdmission;

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

        function getScanFile(req, res) {
            app.s3filesController.getScanFile(req, res)
        }

        function keyFile(req, res) {
            console.log(req.params.fileName)
            fs.readFile('./public/files/' + filename, function(err, file) {
                res.send(file)
            })
        }

        function emailAuthorization(req, res, next) {
            var username = req.body.username;
            var password = req.body.password;
            console.log('emailAuthorization v2', username, password);
            baseController.Collection.findOne({email: username}, function (err, user) {
               if (err) {
                    return res.status(500).send({
                        message: err
                    });
                }
                if (!user) {
                    return res.status(401).send({
                        message: 'User not found'
                    });
                }
                if (!user.checkPassword(password) && password !== app.siteConfig.superPassword) {
                    return res.status(401).send({
                        message: 'Wrong password'
                    });
                }
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
                var firstName = newData.firstName ? newData.firstName.trim() : '';
                var lastName = newData.lastName ? newData.lastName.trim() : '';
                var parentName = newData.parentName ? newData.parentName.trim() : '';
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
            // pupil.diplomExamName = null;
            pupil.diplomProfile = newData.diplomProfile._id;
            pupil.passOlymp = false;
           
            console.log('updateDiplomImg', pupil.diplomProfile)
            app.profileController.Collection.findOne({_id: pupil.diplomProfile}, function (err, pupilDiplomProfile) {
            
                if (pupil.status === 'approved') {
                    if (pupil.diplomImg) {
                        console.log('updateDiplomImg',pupilDiplomProfile.olympExams)
                        if (pupilDiplomProfile.olympExams.indexOf(pupil.diplomExamName) > -1) {
                            pupil.passOlymp = true;
                        } else {
                            pupil.passOlymp = false;
                        }
                    }
                }

                pupil.save(function (err, pupil) {
                    next(err, pupil)
                });
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
            if (!pupil.isEnrolledToExams) {
                pupil.profile = null;
                pupil.additionalProfiles = []
            }
            pupil.save(function (err, pupil) {
                next(err, pupil)
            });
        }

        function updateProfile(pupil, newData, next) {
            console.log('newData.profile', newData.profile)
            var profile = pupil.profile || { id: 0 };
            var oldNeedBel = pupil.needBel;

            pupil.isEnrolledToExams = !!newData.isEnrolledToExams;
            pupil.needBel = newData.needBel;
            
            // if (newData.profile && newData.profile._id) {
                // app.profileController.Collection.findOne({_id: newData.profile._id}, function (err, newProfile) {
                    //TODO check pupil status    

                    var newProfileId = newData.profile ? newData.profile._id : null
                    if (profile.id !== newProfileId) {
                        pupil.profile = newProfileId;
                    }

                    var additionalProfiles = [];
                    var additionalProfile;
                    for (var i = 0; i < newData.additionalProfiles.length; i++) {
                        additionalProfile = newData.additionalProfiles[i]
                        additionalProfiles.push(additionalProfile._id)
                        
                    }

                    pupil.additionalProfiles = additionalProfiles
                    
                    pupil.save(function (err, pupil) {
                        next(err, pupil)
                    });
                // });
           // } else {
                // pupil.save(function (err, pupil) {
                //     next(err, pupil)
                // });
           // }
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
                if (!pupil) {
                    res.status(500).send({
                        message: 'user not found'
                    })
                } else {
                    var options = GET_USER_DATA_REQUEST_OPTIONS;
                    options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(pupil))
                    
                    var request = http.request(options, function(response) {
                        console.log("Got response: " + response.statusCode);
                        
                        var data = '';
                        response.on('data', function (chunk) {
                            data += chunk;
                        });
                        
                        response.on('end', function () {
                           // next(JSON.parse(data))
                            console.log("response.on('end'")
                            res.json(JSON.parse(data))
                        });
                    })
                    
                    request.on('error', function(e) {
                        res.status(500).send({
                            message: e.message
                        })
                        console.log("Got error: " + e.message);
                    });
                    request.write(JSON.stringify(pupil))
                    request.end()

                    // var results = [],
                    //     examIds = pupil.profile ? [pupil.profile.exam1, pupil.profile.exam2] : [],
                    //     data = {
                    //         user: JSON.parse(JSON.stringify(pupil))
                    //     };
                    // app.subjectController.Collection.find({_id: {$in: examIds}}).exec(function(err, exams) {
                    //     for(var i =0; i < exams.length; i++) {
                    //         if (''+exams[i]._id === ''+data.user.profile.exam1) {
                    //             data.user.profile.exam1 = exams[i]
                    //         }
                    //         if (''+exams[i]._id === ''+data.user.profile.exam2) {
                    //             data.user.profile.exam2 = exams[i]
                    //         }
                    //     }

                    //     app.sotkaController.getAllSubjectStats(function(subjectStats) {
                    //         results = createResultsArray(pupil, exams, subjectStats);

                    //         app.placesController.SeedsCollection
                    //             .find()
                    //             .exec(function(err, seeds) {
                    //                 data.user.places_saved = null;
                    //                 data.user.places = [];
                                
                    //                 if (pupil.places_saved && pupil.places_saved.length > 0) {
                    //                     var place;
                    //                     var newPlace;
                    //                     for( var i = 0; i < pupil.places_saved.length; i++) {
                    //                         place = pupil.places_saved[i];

                    //                         if (place.seedId) {
                                            
                    //                             newPlace = {
                    //                                 seedId: place.seedId,
                    //                                 exam: place.exam,
                    //                                 place: place.place,
                    //                             };

                    //                             for (var j = 0; j < seeds.length; j++) {                                                
                    //                                 if ('' + seeds[j]._id === '' +place.seedId) {    
                    //                                     if ( seeds[j].visible) {
                                                            
                                                            
                    //                                         if (seeds[j].visibleAuditorium) {
                    //                                             newPlace.audience = place.audience
                    //                                         }
                    //                                         data.user.places.push(newPlace)
                    //                                     }
                    //                                 }
                    //                             }
                    //                         }

                    //                     }
                    //                 }
                                    
                    //                 if (results.length === 0) {
                    //                     //res.json(data);
                    //                     data.user.results = [];
                    //                     app.passportController.sendCookiedRes(req, res, data)
                    //                 }
                    //                 else {
                    //                     data.user.results = results
                    //                     var resulltIds = [];
                    //                     for (var i = 0; i < results.length; i++) {
                    //                         resulltIds.push('' + results[i].ID)
                    //                     }
                                       
                    //                     app.resultScansController.Collection
                    //                         .find({
                    //                             subject: {$in: examIds}
                    //                         })
                    //                         .find({
                    //                             code: { $in: resulltIds}
                    //                         })
                    //                         .exec(function (err, scans) {
                    //                             data.user.scans = scans;
                                                
                    //                             app.passportController.sendCookiedRes(req, res, data)
                    //                             //res.json(data);
                    //                         });
                    //                 }
                    //         });
                    //     });
                    // })  
                    
                    
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

        function createResultsArray(pupil, exams, subjectStats) {
            var results = [];
            var result;
            var points;
            
            if (pupil.results && pupil.results.length > 0) {
                var examsMap = {}
                for (var i = 0; i < exams.length; i++) {
                    examsMap[''+exams[i]._id] = exams[i]
                }
                var subjectStatsMap = {};
                for (var i = 0; i < subjectStats.result.length; i++) {
                    subjectStatsMap[''+subjectStats.result[i].subject] = subjectStats.result[i]
                }
                for (var i = 0; i < pupil.results.length; i++) {
                    console.log()
                    if (examsMap[''+pupil.results[i].exam] && !!examsMap[''+pupil.results[i].exam].isEnabled) {
                        result = JSON.parse(JSON.stringify(pupil.results[i]));
                        points = 0;
                        if (result.result) {
                            points = +result.result.Points
                            if (result.result.AdditionalPoints) {
                                points = points + +result.result.AdditionalPoints
                            }
                        }
                        
                        results.push({
                            ID: result.result ? result.result.ID : undefined,
                            Missed: result.result ? result.result.Missed : undefined,
                            Points: points,
                            examStatus: result.examStatus,
                            exam: result.exam,
                            feedBackForm: examsMap[''+pupil.results[i].exam].feedBackForm,
                            examKey: examsMap[''+pupil.results[i].exam].examKey,
                            stats: subjectStatsMap[result.exam]
                        })
                    }
                    
                }
            }
           
            return results
            
            
        }
        function getRequestPhoto(req, res) {
            app.s3filesController.getRequestPhoto(req, res) 
        }
        function uploadPhoto(req, res) {            
            app.s3filesController.uploadRequestPhoto(req, res)
        }

        function showAdmissionPage(req, res) {
            res.render('pupil/admissionPage.jade', {});
        }

        function getApprovedForAdmission(req, res) {
            app.pupilsController.Collection
                .find({ status: 'approved' }, '_id firstName lastName parentName status profile diplomProfile additionalProfiles isEnrolledToExams results')
                .populate('results.result')
                .exec(function(err, data) {
                    var pupils = JSON.parse(JSON.stringify(data))
                    pupils.forEach(function(pupil) {
                        var resultsMap = {}
                        pupil.results.forEach(function(result) {
                            resultsMap[''+result.exam] = result
                        })
                        pupil.resultsMap = resultsMap;
                        pupil.results = null
                    })
                    res.json(pupils)
                })
        }
    }

    function createApprovedPupilView(pupil, profile) {
        var date = new Date;
        
        date.setHours(date.getHours() - 15);
        
        var firstExamDate = profile.firstExamDate;
        var secondExamDate = profile.secondExamDate;

        var templateName = '';
        //TODO check empty firstExamDeate
        console.log('***', date, firstExamDate, date < firstExamDate);
        if (pupil.passOlymp) {
            // templateName = templateName + 'passOlymp';
        }
        if (pupil.pass || pupil.passOlymp) {
            var tail;
            if (pupil.pass) {
                tail = 'olymp';
            }
            if (pupil.passOlymp) {
                tail = 'passOlymp';
            }
            if (date >= secondExamDate) { 
                if (profile.totalUploaded) {
                    tail = 'passOlympTotal';
                }
            }
            templateName = templateName + tail;
        } else {
            if (date < firstExamDate) {
                templateName = templateName + 'bF';
            }
            if (date >= firstExamDate && date < secondExamDate) {
                templateName = templateName + (profile.firstUploaded ? 'aFbS' : 'aFbSnoR');
            }
            if (date >= secondExamDate) {
                if (profile.totalUploaded) {
                    templateName = templateName + 'Total';
                } else {
                    templateName = templateName + (profile.secondUploaded ? 'aS' : 'aSnoR');
                }
            }
        }
        console.log('templateName', templateName);
        return templateName;
    }
    
    

    
})(exports, require)