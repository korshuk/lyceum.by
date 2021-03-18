var BaseController = require('./baseController').BaseController,
    translit = require('../modules/translit').translit,
    async = require('async');

SotkaController = function(mongoose, app) {
    var BASE_TIMEOUT = 10 * 60 * 1000;

    var base  = new BaseController('Sotka', 'sotka', mongoose, app);

    // base.Collection.remove({}, function (err) {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         console.log("Removed!!!!!!!!!!!!!!!!!!!!", err)
    //     }
    // })

    base.calculate = calculate;

    setTimeout(function() { 
        base.calculate() 
    }, BASE_TIMEOUT);

    function calculate() {
        var stat = new this.Collection();
        var pupilsCollection = app.pupilsController.Collection;
        var profileStatsCalculators = []
        stat.result = [];

        app.profileController.Collection.find().exec(function (err, profiles) { 
            
            profiles.forEach(function(profile) {   
                profileStatsCalculators.push(function(callback){
                    pupilsCollection.findApprovedPupilsForProfile(profile._id)
                        .exec(function (err, pupils) {                        
                            pupilsCollection.findApprovedOlympPupilsForProfile(profile._id)
                                .exec(function (err, pupilsOlymp) {
                                    var profileStat = {
                                        profile:profile._id,
                                        countTotal:pupils.length,
                                        countOlymp:pupilsOlymp.length
                                    }
                                    callback(null, profileStat);
                                });
                        });
                })
            });

            async.parallel(profileStatsCalculators, function(err, results) {
                stat.result = results.sort(function(a, b) {
                    return a.profile > b.profile
                })

                stat.save(function(err, doc) {
                    console.log('stat.save(function(err, doc) {', doc)
                    setTimeout(function() { 
                        base.calculate() }, 60 * BASE_TIMEOUT);
                })
            })
        });
        //setTimeout(base.calculate, 10 * 60 * 60 * 1000);
    }

    base.calculateStats = function (req, res, isAjax) {
        app.profileController.Collection.find().exec(function (err, profiles) {
            profiles
                .forEach(function(profile) {
                    app
                        .pupilsController
                        .Collection
                        .find({profile: profile._id, status: 'approved'})
                        .exec(function (err, pupils) {
                            app
                                .pupilsController
                                .Collection
                                .find({profile: profile._id, status: 'approved', passOlymp: true})
                                .exec(function (err, pupilsOlymp) {
                                    var resultsF = [];
                                    var resultsS = [];
                                    var resultsT = [];
                                    var i = 0,
                                        pupilsLength = pupils.length,
                                        pupil,
                                        availablePlaces,
                                        passed,
                                        indexOfPass,
                                        lastIndexOf;

                                        profile.countArray = profile.countArray.concat({
                                        count: pupils.length,
                                        date: new Date()
                                    });
                                    for (i ; i < pupilsLength; i++) {
                                        pupil = pupils[i];
                                        if (pupil.exam1 > -1) {
                                            resultsF.push(+pupil.exam1);
                                        }
                                        if (pupil.exam2 > -1) {
                                            resultsS.push(+pupil.exam2);
                                        }
                                        if (pupil.exam1 > -1 && pupil.exam2 > -1 && pupil.sum > -1) {
                                            resultsT.push(+pupil.sum);
                                        }
                                    }

                                    resultsF.sort(function(a, b) {
                                        return a - b;
                                    });
                                    resultsS.sort(function(a, b) {
                                        return a - b;
                                    });
                                    resultsT.sort(function(a, b) {
                                        return a - b;
                                    });

                                    profile.olymp = pupilsOlymp.length;

                                    availablePlaces = profile.ammount - profile.olymp;

                                    if (availablePlaces < 0) {
                                        availablePlaces = 0;
                                    }

                                    passed = availablePlaces;

                                    profile.minF = resultsF[0];
                                    profile.maxF = resultsF[resultsF.length - 1];
                                    profile.passF = resultsF[resultsF.length - availablePlaces];

                                    profile.minS = resultsS[0];
                                    profile.maxS = resultsS[resultsS.length - 1];
                                    profile.passS = resultsS[resultsS.length - availablePlaces];

                                    profile.minT = resultsT[0];
                                    profile.maxT = resultsT[resultsT.length - 1];
                                    profile.passT = resultsT[resultsT.length - availablePlaces];

                                    indexOfPass = resultsT.indexOf(profile.passT);
                                    lastIndexOf = resultsT.lastIndexOf(profile.passT);

                                    profile.halfDelta = 0;
                                    profile.halfPupils = 0;
                                    profile.halfpass = 0;

                                    if (lastIndexOf - indexOfPass > 0) {
                                        profile.halfpass = profile.passT;
                                        profile.passT = resultsT[lastIndexOf + 1];
                                        passed = resultsT.length - lastIndexOf - 1;

                                        profile.halfDelta = profile.ammount - passed - profile.olymp;
                                        profile.halfPupils = lastIndexOf - indexOfPass + 1;

                                        if (profile.halfDelta == profile.halfPupils) {
                                            profile.passT = profile.halfpass;
                                            profile.halfpass = null;
                                            profile.halfDelta = 0;
                                            profile.halfPupils = 0;
                                        }

                                    }
                                    profile.save(function (err, doc) {
                                        console.log('profile save', err, profile.name)
                                    });
                            });
                        });
            });
        });
        if (!isAjax) {
            res.redirect('/admin/settings');
        } else {
            res.json({})
        }
        
    };

    base.restList = function (req, res) {
        var self = this;

        app.profileController.Collection.find().sort('order').exec(function(err, docs) {
                if (err) {
                    res.send(err);
                }
                res.json(docs);
            });
    };

    base.addProfile = function (req, res) {
        var self = this;
        var doc = new self.Collection(req.body);
        doc.save(function(err, result) {
                if (err) {
                    res.send(err);
                }
                else {
                    base.restList(req, res);
                }
            });
    };

    base.removeProfile = function (req, res) {
        var self = this;
        self.Collection.findOne({ '_id': req.params.id }, function(err, doc) {
                if (err) {
                    res.send(err);
                }
                else {
                    doc.remove(function() {
                        base.restList(req, res);
                    });
                }
            });
    };

    base.updateProfile = function (req, res) {
        var self = this;
        self.Collection.findOne({ '_id': req.params.id }, function(err, doc) {
                if (err) {
                    res.send(err);
                }
                else {
                    doc.ammount = req.body.ammount;
                    doc.order = req.body.order || 0;
                    doc.olymp = req.body.olymp || 0;
                    doc.save(function(err, result) {
                        if (err) {
                            res.send(err);
                        }
                        else {
                            base.restList(req, res);
                        }
                    });
                }
            }); 
    };

    base.constructor = arguments.callee;

    return base;
};

exports.SotkaController = SotkaController;