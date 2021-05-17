var BaseController = require('./baseController').BaseController,
    async = require('async');

SotkaController = function(mongoose, app) {
    var BASE_TIMEOUT = 30 * 60 * 1000;

    var base  = new BaseController('Sotka', 'sotka', mongoose, app);

    base.SubjectStatsCollection = require('../models/sotka').SubjectStatsModel;
   // this.model.SubjectStatsModel(mongoose, function () {
     //   base.SubjectStatsSchema = mongoose.model('SubjectStatsSchema');
    //});
    // base.Collection.remove({}, function (err) {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         console.log("Removed!!!!!!!!!!!!!!!!!!!!", err)
    //     }
    // })

    base.calculate = calculate;
    base.calculateSubjects = calculateSubjects;
    base.calculateLoop = calculateLoop;

    setTimeout(function() { 
        base.calculateLoop() 
    }, BASE_TIMEOUT);

    function calculateLoop() {
        base.calculate(function() {
            setTimeout(function() { 
                base.calculateLoop() 
            }, BASE_TIMEOUT);
        })
    }

    function calculateSubjects(next) {

        var pupilsCollection = app.pupilsController.Collection;
        var subjectsCollection = app.subjectController.Collection;
        var subjectsStatsCalculators = [];
        
        pupilsCollection.find({status: 'approved'})
            .populate('profile')
            .populate('additionalProfiles')
            .populate('results.result')
            .exec(function(err, pupils){
                app.profileController.Collection
                    .find()
                    .exec(function(err, profiles) {
                        var subjectToProfilesMap = {};
                        var profile;
                        for (var i = 0; i < profiles.length; i++) {
                            profile = profiles[i];
                            if (!subjectToProfilesMap[profile.exam1]) {
                                subjectToProfilesMap[profile.exam1] = []
                            }
                            if (!subjectToProfilesMap[profile.exam2]) {
                                subjectToProfilesMap[profile.exam2] = []
                            }
                            if (subjectToProfilesMap[profile.exam1]) {
                                subjectToProfilesMap[profile.exam1].push(profile)
                            }
                            if (subjectToProfilesMap[profile.exam2]) {
                                subjectToProfilesMap[profile.exam2].push(profile)
                            }
                        }
                        //console.log('subjectToProfilesMap', subjectToProfilesMap)

                        base.Collection
                            .find()
                            .sort('-date')
                            .exec(function(err, stats) {
                                var lastStat = stats[0];
                                subjectsCollection.find()
                                    .exec(function(err, subjects) {
                                        subjects.forEach(function(subject) {
                                            var subjectProfiles = subjectToProfilesMap[subject._id]
                                            var profileNames = [];
                                            var subjectAmmount = 0;
                                            var subjectOlymp = 0;
                                            var countTotal = 0;
                                            for (var i = 0; i < subjectProfiles.length; i++) {
                                                profileNames.push(subjectProfiles[i].name)
                                                subjectAmmount = subjectAmmount + +subjectProfiles[i].ammount;
                                                
                                                for (var j = 0; j < lastStat.result.length; j++) {
                                                    if (''+lastStat.result[j].profile === ''+subjectProfiles[i]._id) {
                                                        subjectOlymp = subjectOlymp + lastStat.result[j].countOlymp
                                                        countTotal = countTotal + +lastStat.result[j].countTotal;
                                                    }
                                                }
                                            }

                                            subjectsStatsCalculators.push(function(callback){
                                                var pupil;
                                                var results;
                                                var resultsCalculate = []
                                                for (var i = 0; i < pupils.length; i++) {
                                                    pupil = pupils[i];
                                                    results = pupil.results;
                                                    if (results.length > 0) {
                                                        for (var j = 0; j < results.length; j++) {
                                                            if (''+results[j].exam === ''+subject._id) {
                                                                resultsCalculate.push(results[j])
                                                            }
                                                        }
                                                        
                                                    }
                                                }
                                                
                                                var min = 10000000000;
                                                var max = 0;
                                                var presentCount = 0;
                                                var absentCount = 0;
                                                var examResults = [];
                                                resultsCalculate.forEach(function (r) {
                                                    var sum = 0;
                                                    var result = r.result;
                                                    if (r.examStatus === '0') {
                                                        if (result) {
                                                            presentCount = presentCount + 1;
                                                            if (result.Points) {
                                                                sum += +result.Points
                                                            }
                                                            if (result.AdditionalPoints) {
                                                                sum += +result.AdditionalPoints
                                                            }
                                                            if (sum < min) {
                                                                min = sum;
                                                            }
                                                            if (sum > max) {
                                                                max = sum
                                                            }
                                                            examResults.push(sum)
                                                        }
                                                    } 
                                                    if (r.examStatus && r.examStatus !== '0') {
                                                        absentCount = absentCount +1;
                                                    }
                                                    
                                                    
                                                });
                                                examResults = examResults.sort(function(a, b) {
                                                    return a - b
                                                });
                                                
                                                var availablePlaces = subjectAmmount - subjectOlymp;
                                                var pass = min;
                                                if (availablePlaces < 0) {
                                                    availablePlaces = 0;
                                                }
                                                if (examResults.length >= availablePlaces) {
                                                    pass = examResults[examResults.length - availablePlaces];
                                                }
                                                callback(null, {
                                                    subject: subject,
                                                    profileNames:profileNames,
                                                    subjectAmmount: subjectAmmount,
                                                    subjectOlymp: subjectOlymp,
                                                    countTotal: countTotal,
                                                    results: examResults,
                                                    min: min,
                                                    max: max,
                                                    pass: pass,
                                                    absentCount: absentCount,
                                                    presentCount: presentCount
                                                });
                                                
                                            })
                                        });

                                        async.parallel(subjectsStatsCalculators, function(err, results) {
                                            var newSubjectStat = new base.SubjectStatsCollection();
                                            newSubjectStat.result = results;
                                            newSubjectStat.save(function(err, doc) {
                                            //  console.log('newSubjectStat.save', err, doc)
                                                next('Ok')
                                            })
                                            // next({
                                            //     results: results,
                                            //     lastStat: lastStat
                                            // });
                                        })
                                    })
                            })
                    })
            });
    }

    function calculate(next) {
        var stat = new this.Collection();
        var pupilsCollection = app.pupilsController.Collection;
        var profileStatsCalculators = [];
        stat.result = [];
        
        app.profileController.Collection.find().exec(function (err, profiles) { 

            profiles.forEach(function(profile) {   
                profileStatsCalculators.push(function(callback){
                    pupilsCollection.findApprovedPupilsForProfile(profile._id)
                        .exec(function (err, pupils) {
                            var pupilsCount = 0;
                            var i = 0;
                            var pupilsLength = pupils.length;
                            var pupil;
                            for (i; i < pupilsLength; i++) {
                                pupil = pupils[i];
                                
                                if (pupil.diplomProfile) {
                                    
                                    if ('' + pupil.diplomProfile === '' + profile._id) {
                                        pupilsCount++
                                    } else if (pupil.isEnrolledToExams){
                                        pupilsCount++
                                    }
                                } else {
                                    pupilsCount++
                                }
                            } 

                            pupilsCollection.findApprovedOlympPupilsForProfile(profile._id)
                                .exec(function (err, pupilsOlymp) {
                                    var profileStat = {
                                        profile:profile._id,
                                        countTotalBeta:pupils.length,
                                        countOlymp:pupilsOlymp.length,
                                        countTotal: pupilsCount
                                    }
                                    callback(null, profileStat);
                                });
                        });
                })
            });
            app.pupilsController.Collection.calculateExamsCount(function(examsMap) {
                app.subjectController.Collection
                    .find()
                    .exec(function(err, subjects) {
                        var subjectsMap = {}
                        var subject;
                        for(var i = 0; i < subjects.length; i++) {
                            subject = subjects[i];
                            subjectsMap[subject.name] = examsMap[subject._id]
                        }
                        
                        async.parallel(profileStatsCalculators, function(err, results) {
                            pupilsCollection
                                .find({status: 'approved'})
                                .count()
                                .exec(function(err, pupilsCount){
                                    stat.pupilsCount = pupilsCount;
                                    stat.result = results.sort(function(a, b) {
                                        return a.profile > b.profile
                                    })
                                    stat.examsMap = subjectsMap
                    
                                    stat.save(function(err, doc) {
                                        next(doc);
                                    })
                                })
                        })
                    })
            })
            
        });
        //setTimeout(base.calculate, 10 * 60 * 60 * 1000);
    }

    base.restStats = function(req, res) {
        var stats= function (callback) {
            base.Collection
                .find()
                .sort('-date')
                .exec(function (err, data) {
                    queryExecFn(err, data[0], callback)
                });
        };
        var profiles= function (callback) {
            app.profileController.Collection
                .find({}, "_id name ammount order guidePage")
                .exec(function (err, profiles) {
                    var profilesMap = {}
                    for (var i= 0; i < profiles.length; i++) {
                        profilesMap[profiles[i]._id] = profiles[i]
                    }
                    queryExecFn(err, profilesMap, callback)
                });
        };

        async.parallel([
            stats,
            profiles
        ], function (err, results) {
            res.json({
                stats: results[0],
                profiles: results[1]
            })
        })
    };

    base.getAllSubjectStats = function (next) {
        base.Collection
            .find()
            .sort('-date')
            .exec(function(err, stats) {
                var lastStat = stats[0]
                base.SubjectStatsCollection
                    .find()
                    .sort('-date')
                    .exec(function(err, subjectStats) {
                        var lastSubjectsStat = subjectStats[0];
                        // var subjectStat = {};
                        // for (var i = 0; i < lastSubjectsStat.result.length; i++) {
                        //     if(''+lastSubjectsStat.result[i].subject === subjectId) {
                        //         subjectStat = lastSubjectsStat.result[i]
                        //     }
                        // }
                        
                        next(lastSubjectsStat)
                    })
            })
    }

    base.getSubjectStats = function(subjectId, next) {
        base.Collection
            .find()
            .sort('-date')
            .exec(function(err, stats) {
                var lastStat = stats[0]
                base.SubjectStatsCollection
                    .find()
                    .sort('-date')
                    .exec(function(err, subjectStats) {
                        var lastSubjectsStat = subjectStats[0];
                        var subjectStat = {};
                        for (var i = 0; i < lastSubjectsStat.result.length; i++) {
                            if(''+lastSubjectsStat.result[i].subject === subjectId) {
                                subjectStat = lastSubjectsStat.result[i]
                            }
                        }
                        
                        next({
                            subjectStat: subjectStat,
                            totalStat: lastStat
                        })
                    })
            })
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


    base.constructor = arguments.callee;

    return base;

    function queryExecFn(err, data, callback) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, data);
        }
    }
};

exports.SotkaController = SotkaController;