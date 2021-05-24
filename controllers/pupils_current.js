var BaseController = require('./baseController').BaseController,
    async = require('async');

var CACHE = {
    subjects: {
        map: {},
        counter: 0,
        limit: 61
    },
    subjectStats: {
        map: {},
        counter: 37,
        limit: 37
    },
    seeds: {
        map: {},
        counter: 0,
        limit: 29
    }
}

PupilsController = function(mongoose, app) {
    var base = new BaseController('Pupil', '', mongoose, app, true);
    
    base.getUserObject = getUserObject;
    base.resetCache = resetCache;

    base.constructor = arguments.callee;

    app.subjectController.Collection.find().exec(function(err, subjects) {
        createCacheMapSubjects(subjects)
    })
    setTimeout(function() {
        console.log('app.sotkaController.getAllSubjectStats')
        app.sotkaController.getAllSubjectStats(function(subjectStats) {
            console.log('############ app.sotkaController.getAllSubjectStats', subjectStats)
            createCacheMapSubjectStats(subjectStats)
        })
    }, 6000)
    
    app.placesController.SeedsCollection.find().exec(function(err, seeds) {
        createCacheMapSeeds(seeds)
    })

    return base;

    function resetCache(req, res, next) {
        app.subjectController.Collection.find().exec(function(err, subjects) {
            createCacheMapSubjects(subjects)
        })
        app.placesController.SeedsCollection.find().exec(function(err, seeds) {
            createCacheMapSeeds(seeds)
        })
        app.sotkaController.getAllSubjectStats(function(subjectStats) {
            createCacheMapSubjectStats(subjectStats)
        })
        next('Ok')
    }

    function getUserObject(req, res, next) {
        var pupil = req.body;
        var results = [];
        var data = {
            user: JSON.parse(JSON.stringify(pupil))
        };
        // console.log('getUserObject!!!!!!!!', pupil.firstName, examIds)
        
        evaluateCacheSubjects();
        evaluateCacheSubjectStats();
        evaluateCacheSeeds();

        if (data.user.profile) {
            data.user.profile.exam1 = CACHE.subjects.map[data.user.profile.exam1];
            data.user.profile.exam2 = CACHE.subjects.map[data.user.profile.exam2];
        }
        
        results = createResultsArray(data.user);
        
        if (data.user.places_saved && data.user.places_saved.length > 0) {
            data.user.places = calculatePupilPlaces( JSON.parse(JSON.stringify(data.user.places_saved)) )
            data.user.places_saved = null;
        }
        if (results.length === 0) {
            data.user.results = [];
            next(data)
        } else {
            data.user.results = results
            var resulltIds = [];
            var examSeedIds = []
            // ('data.user.results', data.user.results)
            for (var i = 0; i < results.length; i++) {
                resulltIds.push('' + results[i].ID)
                examSeedIds.push('' + results[i].exam)
            }
            app.resultScansController.Collection
                .find({
                    subject: {$in: examSeedIds}
                })
                .find({
                    code: { $in: resulltIds}
                })
                .exec(function (err, scans) {
                    data.user.scans = scans;
                    next(data)
                });
        }
        // console.log('CACHE_SUBJECTS_LIST', results)
        // next([])
    }

    function calculatePupilPlaces(places_saved) {
        var places = [];
        var place;
        var seed;
        var newPlace;
        for( var i = 0; i < places_saved.length; i++) {
            place = places_saved[i];
            if (place.seedId) {
                newPlace = {
                    seedId: place.seedId,
                    exam: place.exam,
                    place: place.place,
                };
                if (CACHE.seeds.map[place.seedId]) {
                    seed = CACHE.seeds.map[place.seedId];
                    if ( seed.visible) {                      
                        if (seed.visibleAuditorium) {
                            newPlace.audience = place.audience
                        }
                        places.push(newPlace)
                    }
                }
            }
        }
        return places;
    }

    function evaluateCacheSeeds() {
        CACHE.seeds.counter = CACHE.seeds.counter + 1;
        // console.log(CACHE.seeds.counter, CACHE.seeds.limit)
        if (CACHE.seeds.counter >= CACHE.seeds.limit) {
            app.placesController.SeedsCollection.find().exec(function(err, seeds) {
                // console.log('seeds cache recalculate', seeds)
                createCacheMapSeeds(seeds)
                CACHE.seeds.counter = 0;
            })
        }
    }

    function evaluateCacheSubjectStats() {
        CACHE.subjectStats.counter = CACHE.subjectStats.counter + 1;
        // console.log(CACHE.subjectStats.counter, CACHE.subjectStats.limit)
        if (CACHE.subjectStats.counter >= CACHE.subjectStats.limit) {
            
            app.sotkaController.getAllSubjectStats(function(subjectStats) {
                // console.log(subjectStats)
                // console.log('SubjectStats cache recalculate', subjectStats)
                createCacheMapSubjectStats(subjectStats)
                CACHE.subjectStats.counter = 0;
            })
        }
    }

    function evaluateCacheSubjects() {
        CACHE.subjects.counter = CACHE.subjects.counter + 1;
        // console.log(CACHE.subjects.counter, CACHE.subjects.limit)
        if (CACHE.subjects.counter >= CACHE.subjects.limit) {
            app.subjectController.Collection.find().exec(function(err, subjects) {
                // console.log('subjects cache recalculate', subjects)
                createCacheMapSubjects(subjects)
                CACHE.subjects.counter = 0;
            })
        }
    } 

    function createCacheMapSubjects(subjects) {
        CACHE.subjects.map = {};
        for (var i = subjects.length - 1; i >= 0 ; i--)  {
            // console.log('123',i, subjects.length, subjects[i].name)
            CACHE.subjects.map[subjects[i]._id] = subjects[i]
        }
    }

    function createCacheMapSubjectStats(subjectStats) {
        CACHE.subjectStats.map = {};
        for (var i = subjectStats.result.length - 1; i >= 0 ; i--)  {
            // console.log('createCacheMapSubjectStats 123',i, subjectStats.result.length, subjectStats.result[i])
            CACHE.subjectStats.map[subjectStats.result[i].subject] = subjectStats.result[i]
        }
        // console.log('%%%%%%%createCacheMapSubjectStats%%%%%%%%%', CACHE.subjectStats.map)
    }

    function createCacheMapSeeds(seeds) {
        CACHE.seeds.map = {};
        for (var i = seeds.length - 1; i >= 0 ; i--)  {
            // console.log('createCacheMapSeeds 123',i, seeds.length, seeds[i])
            CACHE.seeds.map[seeds[i]._id] = seeds[i]
        }
    }

    function createResultsArray(pupil) {
        var results = [];
        var result;
        var points;
        
        if (pupil.results && pupil.results.length > 0) {
            // console.log('CACHE.subjectStats.map', CACHE.subjectStats.map)
            for (var i = 0; i < pupil.results.length; i++) {
                // console.log('pupil.results', pupil.results)
                if (CACHE.subjects.map[''+pupil.results[i].exam] && !!CACHE.subjects.map[''+pupil.results[i].exam].isEnabled) {
                    result = JSON.parse(JSON.stringify(pupil.results[i]));
                    points = 0;
                    
                    if (result.result && result.result.Points) {
                        points = +result.result.Points
                        if (result.result.AdditionalPoints) {
                            points = points + +result.result.AdditionalPoints
                        }
                    }
                    var stats = JSON.parse(JSON.stringify(CACHE.subjectStats.map[result.exam]))
                    var examResultsArray = JSON.parse(JSON.stringify(stats.results));
                    stats.results = []
                    // var myRaiting = examResultsArray.reverse().indexOf(33)
                    stats.raitingAmmount = examResultsArray.length;
                    stats.myRaiting = examResultsArray.reverse().map(function (p, i) {
                        return p === points ? i+1 : ''    
                    }).filter(String);

                    
                    results.push({
                        ID: result.result ? result.result.ID : undefined,
                        Missed: result.result ? result.result.Missed : undefined,
                        Points: points,
                        examStatus: result.examStatus,
                        exam: result.exam,
                        feedBackForm: CACHE.subjects.map[result.exam].feedBackForm,
                        examKey: CACHE.subjects.map[result.exam].examKey,
                        stats: stats
                    })
                }
                
            }
        }
       
        return results
    }

    function queryExecFn(err, data, callback) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, data);
        }
    }
};

exports.PupilsController = PupilsController;