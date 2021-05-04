var json2csv = require('json2csv').parse;
var BaseController = require('./baseController').BaseController;
var async = require('async');

var PlacesController = function (mongoose, app) {
    var base = new BaseController('Places', '', mongoose, app, true);

    var seedsModel = require('../models/seeds');
    
    seedsModel.define(mongoose, function(){
        base.SeedsCollection = mongoose.model('Seed');
    });

    var DataService = {
        generateDictionary: generateDictionary,
    };

    

    base.showSeats = showSeats;

    base.hideSeats = hideSeats;

    base.seatsEmailExport = seatsEmailExport;

    base.list = list;
    base.seedaAppPage = seedaAppPage;
    base.getDictionary = getDictionary;
    base.getCorpses = getCorpses;
    base.getGenerateStatus = getGenerateStatus;
    base.generatePupilSeeds = generatePupilSeeds;
    base.getPupilsForCorps = getPupilsForCorps;
    base.changeAudience = changeAudience;
    base.saveCurrentSeats = saveCurrentSeats;
    base.cnangeSeedVisibleState = cnangeSeedVisibleState;
    
    base.create = function (req, res) {
        var self = this,
            doc;
        if (req.session && req.session.locals && req.session.locals.doc) {
            doc = req.session.locals.doc;
            req.session.locals = {};
        } else {
            doc = new self.Collection();
        }
        var queryId = '';
        if (req.query && req.query.id) {
            queryId = req.query.id;
        }
        app.sotkaController.calculate(function(lastStat){
            app.subjectController.Collection
                .find()
                .sort('name')
                .exec(function (err, subjects) {
                    res.render(self.viewPath + 'new.jade', {
                        doc: doc,
                        queryId: queryId,
                        subjects: subjects,
                        lastStat: lastStat,
                        method: 'post',
                    });
            });
        });
    };

    base.edit = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            app.sotkaController.calculate(function(lastStat) {
                app.subjectController.Collection
                    .find()
                    .sort('name')
                    .exec(function (err, subjects) {
                        res.render(self.viewPath + 'new.jade', {
                            doc: doc,
                            method: 'put',
                            subjects: subjects,
                            lastStat: lastStat,
                        });
                    });
            });
        });
    };

    base.save = function (req, res) {
        var self = this;
        var doc = new this.Collection(req.body);

        doc.save(function (err) {
            if (err) {
                req.session.error =
                    'Не получилось сохраниться(( Возникли следующие ошибки: <p>' +
                    err +
                    '</p>';
                req.session.locals = { doc: doc };
                res.redirect(self.path + '/create');
            } else {
                req.session.success =
                    'Место <strong>' +
                    doc.name +
                    '</strong> создано ' +
                    doc.createdAt;
                res.redirect(self.path);
            }
        });
    };

    base.update = function (req, res) {
        var self = this;

        this.Collection.findByReq(req, res, function (doc) {
            doc.code = req.body.code;
            doc.name = req.body.name;
            doc.address = req.body.address;
            doc.audience = [];
            for (var i = 0; i < req.body.audience.length; i++) {
                req.body.audience[i].bel = req.body.audience[i].bel === 'on';
                doc.audience.push(req.body.audience[i]);
            }
            doc.save(function (err) {
                if (err) {
                    req.session.error =
                        'Не получилось обновить место(( Возникли следующие ошибки: <p>' +
                        err +
                        '</p>';
                    req.session.locals = { doc: doc };
                    res.redirect(self.path + '/edit/' + doc.id);
                } else {
                    req.session.success =
                        'Место <strong>' + doc.name + '</strong> обновлено';
                    res.redirect(self.path);
                }
            });
        });
    };

    base.remove = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            var name = doc.name;
            doc.remove(function () {
                req.session.success =
                    'Место <strong>' + name + '</strong> успешно удалёно';
                res.redirect(self.path);
            });
        });
    };

    base.constructor = arguments.callee;

    var Helpers = {
        getPlacesIdsForSubjects: getPlacesIdsForSubjects,
        populatePlacesArray: populatePlacesArray,
        createCorpsesFn: createCorpsesFn,
        createSabjectsMap: createSabjectsMap,
        checkPlaces: checkPlaces,
        audienceSort: audienceSort,
        getPupilsToSeed: getPupilsToSeed,
        getSubjectIds: getSubjectIds,
        calculateCorpsesAmmount: calculateCorpsesAmmount,
        saveGeneratedSeats: saveGeneratedSeats,
        saveSeats: saveSeats
    }

    var Seeder = {
        seedPupilsInCorpse: seedPupilsInCorpse,
        seedPupilsInPlace: seedPupilsInPlace,
        generatePupilPicks: generatePupilPicks,
        generatePicksForAudience: generatePicksForAudience,
        seedPupilsInAudiences: seedPupilsInAudiences,
        seedPupilsInAudience: seedPupilsInAudience
    };

    return base;

    function cnangeSeedVisibleState(req, res, newState) {
        var examNum = req.params.examNum;
        var self = this;
        base.SeedsCollection
            .findOne({examNum: +examNum})
            .exec(function(err, seed) {
                seed.visible = newState;
                seed.save(function(err, doc) {
                    res.redirect(self.path);
                })
            })
    }

    function changeAudience(req, res) {
        var exumNum = req.params.examNum;
        var query = req.query;
        var corpsQuery = query.corps;
        var placeQuery = query.place;

        var pupilId = req.body.pupilId;
        var audienceId = req.body.audienceId;

        app.pupilsController.Collection
            .findOne({_id: pupilId})
            .populate('profile')
            .populate('additionalProfiles')
            .exec(function(err, pupil) {

                base.getCorpses(exumNum, function (corpses, subjects) {
                    
                    var subjectsIds = Helpers.getSubjectIds(subjects);
                    var exams = app.pupilsController.Collection.getPupilExams(pupil)
                    console.log('exams', exams)
                    var exam;
                    for(var j = 0; j < exams.length; j++) {
                        if (subjectsIds.indexOf(exams[j]) > -1) {
                            exam = exams[j]
                        }
                    }
                    var pupilExamNum = exams.indexOf(exam)
                    
                    var corps;
                    for (var k = 0; k < corpses.length; k++) {
                        corps = corpses[k]
                        for (var i = 0; i < corps.places.length; i++) {
                            for (var j = 0; j < corps.places[i].audience.length; j++) {
                                if (corps.places[i].audience[j]._id === audienceId) {
                                    newPlace = corps.places[i]._id;
                                    newAudience = corps.places[i].audience[j]._id;
                                    newCorps = corps.alias
                                }
                            }
                        }
                    }

                    pupil.places_generated[pupilExamNum].audience = newAudience;
                    pupil.places_generated[pupilExamNum].corps = newCorps;
                    pupil.places_generated[pupilExamNum].place = newPlace;
                    
                    pupil.save(function(err, doc) {
                        console.log('pupil save', err, doc)
                        base.getPupilsForCorps(exumNum, corpsQuery, function(pupils) {
                            res.json({
                                corpses: corpses,
                                pupils: pupils
                            });
                        })
                        
                    })
                    
                    
                })
            })
    }

    function saveCurrentSeats(req, res) {
        var examNum = req.params.examNum;

        base.getCorpses(examNum, function (corpses, subjects) {
            var subjectsIds = Helpers.getSubjectIds(subjects);
                                   
            Helpers.getPupilsToSeed(subjectsIds, function (pupilsToSeed) {
                Helpers.saveSeats(pupilsToSeed, function() {
                    base.SeedsCollection.findOne({examNum: +examNum})
                        .exec(function(err, seed) {
                            if (!seed) {
                                seed = new base.SeedsCollection();   
                            } 
                            seed.examNum = +examNum;
                            seed.savedDate = new Date()
                            seed.save(function(err, doc) {
                                response = {
                                    timestemp: seed.savedDate.getTime()
                                };
        
                                res.json(response)
                            })
                        })
                });
            });
        });
    }

    function getPupilsForCorps(exumNum, corpsQuery, next) {
        
        base.getCorpses(exumNum, function (corpses, subjects) {
            var subjectsIds = Helpers.getSubjectIds(subjects);
            console.log(exumNum, corpsQuery, subjectsIds)
            var sabjectsMap = Helpers.createSabjectsMap(subjects);

            Helpers.getPupilsToSeed(subjectsIds, function (pupilsToSeed) {
                console.log(pupilsToSeed.length)
                var data = [];
                var pupil;
                var exam;
                var exams;
                var pupilExamNum;
                for(var i = 0; i < pupilsToSeed.length; i++) {
                    pupil = pupilsToSeed[i].pupil;
                    exam = pupilsToSeed[i].exam;
                    if (corpsQuery && corpsQuery.length > 0) {
                        
                        exams = app.pupilsController.Collection.getPupilExams(pupil)
                        pupilExamNum = exams.indexOf(exam);
                        
                        // console.log(pupil.places_generated[pupilExamNum])
                        if (pupil.places_generated && pupil.places_generated[pupilExamNum].corps === corpsQuery) {
                            data.push({
                                _id: pupil._id,
                                firstName: pupil.firstName,
                                lastName: pupil.lastName,
                                parentName: pupil.parentName,
                                audience: pupil.places_generated[pupilExamNum].audience,
                                subject: exam,
                                needBel: pupil.needBel
                            })
                        }
                    }
                    
                }
                next(data)
            })
        })
    }

    function generatePupilSeeds(req, res) {
        var response;
        var examNum = req.params.examNum;

        base.getCorpses(examNum, function (corpses, subjects) {
            var subjectsIds = Helpers.getSubjectIds(subjects);
            
            var sabjectsMap = Helpers.createSabjectsMap(subjects);

            console.log('subjectsIds', subjectsIds, subjects, sabjectsMap)
                       
            Helpers.getPupilsToSeed(subjectsIds, function (pupilsToSeed) {
                console.log('pupilsToSeed', pupilsToSeed.length)
                    
                var responseErrors = [];
                
                var belErrors;

                for (var i = 0; i < corpses.length; i++) {
                    belErrors = Helpers.checkPlaces(corpses[i], sabjectsMap, pupilsToSeed);
                    responseErrors = responseErrors.concat(belErrors);
                }


                if (responseErrors.length > 0) {
                    response = {
                        errors: responseErrors,
                    };

                    res.json(response)
                } else {
                    var responsePupils = [];
                    var seededPupils;
                    for (i = 0; i < corpses.length; i++) {
                        seededPupils = Seeder.seedPupilsInCorpse(
                            corpses[i],
                            sabjectsMap,
                            pupilsToSeed
                        );
                        
                        responsePupils = responsePupils.concat(seededPupils);
                    }

                    Helpers.saveGeneratedSeats(responsePupils, function() {
                        base.SeedsCollection.findOne({examNum: +examNum})
                            .exec(function(err, seed) {
                                if (!seed) {
                                    seed = new base.SeedsCollection();   
                                } 
                                seed.examNum = +examNum;
                                seed.generatedDate = new Date()
                                seed.save(function(err, doc) {
                                    response = {
                                        corpses: corpses,
                                        responsePupils: responsePupils
                                    };
            
                                    res.json(response)
                                })
                            })
                        
                    })

                }

            })
        })
    }

    function getGenerateStatus(req, res) {
        var examNum = req.params.examNum;

        base.SeedsCollection
            .findOne({examNum: +examNum})
            .exec(function (erroe, seed) {
                if (!seed) {
                    res.json({
                        generateStatus: false,
                    });
                } else {
                    console.log('###', seed)
                    var date = new Date(seed.generatedDate);
                    var dateSaved = new Date(seed.savedDate);
                    res.json({
                        generateStatus: true,
                        timestemp: date.getTime(),
                        timestempSaved: dateSaved.getTime()
                    });
                }
            })
        
    }

    function getCorpses(exumNum, next) {
        app.subjectController.Collection.findSubjectsForExamNumber(exumNum, function (subjects) {
            var placeIds = Helpers.getPlacesIdsForSubjects(subjects);            

            base.Collection.find({_id: {$in: placeIds}}).exec(function (err, places) {
                
                var placesArray = Helpers.populatePlacesArray(places, subjects)
                
                var corpses = Helpers.createCorpsesFn(placesArray);

                next(corpses, subjects)
                
            });

        })
    }

    /// Helpers start

    function saveSeats(responsePupils, next) {
        var exams;
        var pupilExamNum;
        var pupil;
        var exam;
        var updateObj;
        var queries = [];
        for(var i = 0; i < responsePupils.length; i++) {
            pupil = responsePupils[i].pupil;
            exam = responsePupils[i].exam;

            exams = app.pupilsController.Collection.getPupilExams(pupil)
            pupilExamNum = exams.indexOf(exam);
            
            if (pupil.places_saved.length === 0) {
                for(var j = 0; j < exams.length; j++) {
                    pupil.places_saved[j] = {
                        exam: exams[j]
                    }
                }
            }
            pupil.places_saved[pupilExamNum].audience = pupil.places_generated[pupilExamNum].audience;
            pupil.places_saved[pupilExamNum].corps = pupil.places_generated[pupilExamNum].corps;
            pupil.places_saved[pupilExamNum].place = pupil.places_generated[pupilExamNum].place;
            pupil.places_saved[pupilExamNum].exam = pupil.places_generated[pupilExamNum].exam;

            updateObj = {};
            updateObj.places_saved = pupil.places_saved;

            queries.push(creatExecFunction(pupil._id, updateObj) );
        }
        async.parallel(queries, onDone);

        function onDone (err, results) {
            if (err) {
                console.log('saveSeats Error', err)
            } else {
                console.log('results')
                next()
            }
        }
    }

    function saveGeneratedSeats(responsePupils, next) {
        var exams;
        var pupilExamNum;
        var pupil;
        var exam;
        var updateObj;
        var queries = [];
        for(var i = 0; i < responsePupils.length; i++) {
            pupil = responsePupils[i].pupil;
            exam = responsePupils[i].exam;

            exams = app.pupilsController.Collection.getPupilExams(pupil)
            pupilExamNum = exams.indexOf(exam);
            
            if (pupil.places_generated.length === 0) {
                for(var j = 0; j < exams.length; j++) {
                    pupil.places_generated[j] = {
                        exam: exams[j]
                    }
                }
            }
            pupil.places_generated[pupilExamNum].audience = pupil.audience;
            pupil.places_generated[pupilExamNum].corps = pupil.corps;
            pupil.places_generated[pupilExamNum].place = pupil.place;
            pupil.places_generated[pupilExamNum].exam = exam;

            console.log(pupilExamNum, pupil.places_generated)
            updateObj = {};
            updateObj.places_generated = pupil.places_generated;

            queries.push(creatExecFunction(pupil._id, updateObj) );
        }
        async.parallel(queries, onDone);

        function onDone (err, results) {
            if (err) {
                console.log('saveGeneratedSeats Error', err)
            } else {
                console.log('results')
                next()
            }
        }
        

    }

    function creatExecFunction (id, obj) {
        return function(callback) {
            app.pupilsController.Collection
                .findOneAndUpdate({ _id: id}, { '$set': obj }) 
                .exec(function (err, data) {
                    queryExecFn(err, data, callback);
                });
        }
    }

    function queryExecFn(err, data, callback) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, data);
        }
    }

    function getSubjectIds(subjects) {
        var subjectsIds = [];
        for (var i = 0; i < subjects.length; i++) {
            subjectsIds.push('' + subjects[i]._id)
        }
        return subjectsIds;
    }

    function getPupilsToSeed(subjectsIds, next) {
        app.pupilsController.Collection
                .find({status: 'approved'})
                .populate('profile')
                .populate('additionalProfiles')
                .exec(function(err, pupils){
                    var exams;
                    var pupil;
                    var pupilsToSeed = []
                    for (var i = 0; i < pupils.length; i++) {
                        pupil = pupils[i];
                        exams = app.pupilsController.Collection.getPupilExams(pupil)
                        if (!pupil.passOlymp || pupil.isEnrolledToExams) {
                            //console.log(exams)
                            for(var j = 0; j < exams.length; j++) {
                                if (subjectsIds.indexOf(exams[j]) > -1) {
                                    pupilsToSeed.push({
                                        pupil: pupil,
                                        exam: exams[j]
                                    })
                                }
                            }
                        }
                    }
                    next(pupilsToSeed)
                })
    }

    function populatePlacesArray(places, subjects) {
        var placesArray = [];
        for (var i = 0; i < places.length; i++) {
            placesArray.push(JSON.parse(JSON.stringify(places[i])))
            var subject = subjects.filter(function(s){
                return ''+ s.place === ''+ places[i]._id
            })[0]
            placesArray[i].subject = subject
        }
        return placesArray
    }

    function getPlacesIdsForSubjects(subjects) {
        var placeIds = [];
        for (var i = 0; i < subjects.length; i++) {
            placeIds.push(subjects[i].place)
        }
        return placeIds
    }

    function createSabjectsMap(subjects) {
        var map = {};
        var i = 0;
        var length = subjects.length;
        var subject;

        for (i; i < length; i++) {
            subject = subjects[i];

            map[subject.place] = subject;
        }

        return map;
    }

    function createCorpsesFn(places) {
        var corpsesMap = {};
        var corpses = [];
        var corps;
        var i = 0;
        var length = places.length;

        for (i; i < length; i++) {
            places[i].audience = places[i].audience.sort(function (a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });
            corps = places[i];
            if (corpsesMap[corps.name]) {
                corpsesMap[corps.name].places.push(corps);
            } else {
                corpsesMap[corps.name] = {
                    name: corps.name,
                    alias: toUTF8Array(corps.name),
                    places: [corps],
                };
            }
        }
        for (corps in corpsesMap) {
            if (corpsesMap.hasOwnProperty(corps)) {
                corpses.push(corpsesMap[corps]);
            }
        }

        return corpses;
    }

    function checkPlaces(corps, sabjectsMap, pupilsToSeed) {
        var placesLength = corps.places.length;
        var profiledPupils;
        var belPupilsLength;
        var audienceForBelLang;
        var responseErrors = [];
        var i = 0, place, subjectId, subject, max;
    
        for (i; i < placesLength; i++) {
            place = corps.places[i]
            subject = sabjectsMap[place._id];
            subjectId = subject._id;

            profiledPupils = pupilsToSeed.filter(function(pupilToSeed) {
                return '' + subjectId === '' + pupilToSeed.exam
            });
            
            belPupilsLength = profiledPupils.filter(function(pupilToSeed){
                return pupilToSeed.pupil.needBel === true
            }).length;
    
            audienceForBelLang = place.audience.filter(function(aud) {
                return aud.bel === true
            })[0];

            max = 0;
            if (audienceForBelLang) {
                max = audienceForBelLang.max;
            }
            if (max < belPupilsLength) {
                responseErrors.push({
                    corpsName: corps.name,
                    subjectName: subject.name,
                    belPupilsLength: belPupilsLength,
                    audienceForBelLang: audienceForBelLang
                })
            }
        }
    
        return responseErrors;
    }

    function audienceSort(a, b){
        var value = a.max - b.max;
    
        if (a.bel !== b.bel ) {
            value = a.bel === true ? -1 : 1;
        }
    
        return value;
    }
    
    function calculateCorpsesAmmount(corpses) {
        var ammount = {
            total: 0,
            bel: 0
        }
        for(var i = 0; i < corpses.length; i++) {
            for(var j = 0; j < corpses[i].places.length; j++) {
                for(var k = 0; k < corpses[i].places[j].audience.length; k++) {
                    ammount.total = ammount.total + corpses[i].places[j].audience[k].max;
                    if (corpses[i].places[j].audience[k].bel) {
                        ammount.bel = ammount.bel + corpses[i].places[j].audience[k].max
                    }
                }
            }
        }

        return ammount

    }

    /// Helpers end

    // Seeder start
    function seedPupilsInCorpse(corps, sabjectsMap, pupilsToSeed) {
        var placesLength = corps.places.length;
        var responsePupils = [];
        var seededPupils;
        var profiledPupils;
        var place;
        var sabjectId;
        console.log('seedPupilsInCorpse', corps.name, placesLength);
        for (var i = 0; i < placesLength; i++) {
            place = corps.places[i];
            sabjectId = sabjectsMap[place._id]._id;
            
            profiledPupils = pupilsToSeed.filter(function(pupilToSeed) {
                return ('' + sabjectId) === ('' + pupilToSeed.exam)
            });
            
            seededPupils = Seeder.seedPupilsInPlace(place, corps, profiledPupils);
            responsePupils = responsePupils.concat(seededPupils);
        }
    
        return responsePupils;
    }
    
    function seedPupilsInPlace(place, corps, profiledPupils) {
                
        Seeder.generatePupilPicks(profiledPupils, place, corps);

        console.log('corps', corps.count)
    
        Seeder.seedPupilsInAudiences(profiledPupils, {
            audiences: place.audience,
            placeId: place._id, 
            corpsId: corps.alias
        });

        return profiledPupils;
    }

    function generatePupilPicks(profiledPupils, place, corps) {
        var profiledPupilsLength = profiledPupils.length;
        var belPupilsLength = profiledPupils.filter(function(profiledPupil){
            return profiledPupil.pupil.needBel === true
        }).length;
        var numbersArr = [];
        var audiences = place.audience.sort(Helpers.audienceSort); 
        
        var i = 0, picksArray;
        var audiencesLength = audiences.length;
    
        if (!corps.count) {
            corps.count = 0;
        }
        if (!place.count) {
            place.count = 0;
        }
        if (!corps.max) {
            corps.max = 0;
        }
        if (!place.max) {
            place.max = 0;
        }
        
        for (i; i < profiledPupilsLength; i++ ) { 
            numbersArr.push(i);
        }

        for (i = 0; i < audiencesLength; i++) {
            picksArray = Seeder.generatePicksForAudience(numbersArr, audiences[i], profiledPupils, belPupilsLength);
            audiences[i].count = picksArray.length;
            audiences[i].picks = picksArray;
            console.log('generatePicksForAudience completed', audiences[i].name, audiences[i].count)
            place.count = place.count + picksArray.length;  
            place.max = place.max + audiences[i].max;        
        }
        corps.count = corps.count + place.count;
        corps.max = corps.max + place.max;
    }

    function generatePicksForAudience(numbersArr, audience, profiledPupils, belPupilsLength) {
        var audienceMax = audience.max;
        var picksArray = [];
        var randomIndex;
        var belAudienceFlag = audience.bel === true;
        var belPupilFlag;

        if (numbersArr.length <= audienceMax) {
            audienceMax = numbersArr.length
        }
        if (belAudienceFlag) {
            if (belPupilsLength <= audienceMax) {
                audienceMax = belPupilsLength
            }
        }
        console.log(audience.name, belAudienceFlag, audience.max, '-', audienceMax,' * ' ,numbersArr.length)
       
        while (picksArray.length < audienceMax){
            randomIndex = Math.floor(Math.random() * numbersArr.length);
            belPupilFlag = profiledPupils[numbersArr[randomIndex]].pupil.needBel === true;
            
            if (belPupilFlag) {
                console.log('belPupilsFlag detected', belAudienceFlag, belPupilFlag)
            }
            
            if (belAudienceFlag === belPupilFlag) {
                picksArray.push(numbersArr[randomIndex]);
                numbersArr.splice(randomIndex, 1);
                if (belPupilFlag === true) {
                    
                    belPupilsLength = belPupilsLength - 1;
                }
            }
        }
        return picksArray.filter(notEmptyPick);

        function notEmptyPick(pick) {
            return pick >= 0;
        }
    }
    
    function seedPupilsInAudiences(pupils, options) {
        var audiences = options.audiences;
        var audiencesLength = audiences.length;
    
        for(var i = 0; i < audiencesLength; i++) {
            Seeder.seedPupilsInAudience(pupils, {
                audience: audiences[i],
                placeId: options.placeId,
                corpsId: options.corpsId,
            });
               
        }
    }

    function seedPupilsInAudience(pupils, options) {
        var audienceId = options.audience._id;
        var placeId = options.placeId;
        var corpsId = options.corpsId;
        var picks = options.audience.picks;
        var picksLength = picks.length;
        var i = 0, pick;
    
        for(i; i < picksLength; i++) {
            pick = picks[i];
            pupils[pick].pupil.audience = audienceId;
            pupils[pick].pupil.place = placeId;
            pupils[pick].pupil.corps = corpsId;
        } 
    }


    // Seeder end

    function getDictionary(req, res) {
        base.Collection.find().exec(function (err, places) {
            app.subjectController.Collection.find().exec(function (err, subjects) {
                app.profileController.Collection.find().exec(function (
                    err,
                    profiles
                ) {
                    var corpses = createCorpsesFn(places);
                    var data = DataService.generateDictionary({
                        corpses: corpses,
                        profiles: profiles,
                        subjects: subjects
                    });
                    res.json(data);
                });
            });
        });
    }

    function generateDictionary(db) {
        var data = {
            corpses: {},
            places: {},
            audiences: {},
            profiles: {},
            subjects: {}
        };

        for (var i = 0; i < db.corpses.length; i++) {
            data.corpses[db.corpses[i].alias] = db.corpses[i].name;

            for (var j = 0; j < db.corpses[i].places.length; j++) {
                data.places[db.corpses[i].places[j]._id] = {
                    code: db.corpses[i].places[j].code,
                    name: db.corpses[i].places[j].name,
                };

                for (
                    var k = 0;
                    k < db.corpses[i].places[j].audience.length;
                    k++
                ) {
                    data.audiences[db.corpses[i].places[j].audience[k]._id] =
                        db.corpses[i].places[j].audience[k].name;
                }
            }
        }

        for (i = 0; i < db.profiles.length; i++) {
            data.profiles[db.profiles[i]._id] = db.profiles[i].name;
        }
        for (i = 0; i < db.subjects.length; i++) {
            data.subjects[db.subjects[i]._id] = db.subjects[i].name;
        }

        return data;
    }



    function seedaAppPage(req, res) {
        var self = this;
        var exumNum = req.params.examNum;
        
        base.getCorpses(exumNum, function (corpses, subjects) {
            var subjectsIds = Helpers.getSubjectIds(subjects);

            var ammount = Helpers.calculateCorpsesAmmount(corpses);
            
            var placesIds = []
            for(var i = 0; i < subjects.length; i++) {
                placesIds.push(subjects[i].place)
            }

            base.Collection.find({_id: {$in: placesIds}})
                .exec(function(err, places) {
                    var placesMap = {};
                    for(var i = 0; i < places.length; i++) {
                        placesMap[places[i]._id] = places[i]
                    }
                    Helpers.getPupilsToSeed(subjectsIds, function(pupilsToSeed) {
                        res.render(self.viewPath + 'seedApp.jade', {
                            exumNum: exumNum,
                            examDate: subjects[0],
                            corpses: corpses,
                            subjects: subjects,
                            ammount: ammount,
                            pupilsToSeed: pupilsToSeed,
                            belPupilsLength: pupilsToSeed.filter(function(pupilToSeed){
                                return pupilToSeed.pupil.needBel === true
                            }).length,
                            places: placesMap
                        });
                    })
                })
        });
    }

    function list(req, res) {
        var self = this;
        this.Collection.find()
            .sort('-createdAt')
            .exec(function (err, docs) {
                app.sotkaController.calculate(function(lastStat){
                    app.subjectController.Collection.find().sort('name').exec(function (
                        err,
                        subjects
                    ) {
                        var examDates = app.subjectController.Collection.getExamDatesArray(
                            subjects
                        );
                        base.SeedsCollection.find().exec(function(err, seeds) {
                            var seedsMap = {}
                            for (var index = 0; index < seeds.length; index++) {
                                if (seeds[index].examNum) {
                                    seedsMap[seeds[index].examNum] = seeds[index]
                                }
                            }
                            res.render(self.viewPath + 'list.jade', {
                                docs: docs,
                                subjects: subjects,
                                examDates: examDates,
                                viewName: self.name.toLowerCase(),
                                lastStat: lastStat,
                                seedsMap: seedsMap,
                                siteConfig: self.app ? self.app.siteConfig : {},
                            });
                        })
                    });
                });
            });
    }

    function seatsEmailExport(req, res) {
        var examNum = req.params.examNum;

        app.pupilsController.Collection.find({ status: 'approved' })
            .populate('profile')
            .populate('place1')
            .populate('place2')
            .exec(onPupilsFound);

        function onPupilsFound(err, data) {
            var fields = [
                'email',
                'firstName',
                'lastName',
                'profile',
                'date',
                'placeName',
                'placeAddress',
                'audience',
            ];
            var opts = { fields: fields };
            var exportData = [];
            var csvData;

            var pupils = data.filter(function (pupil) {
                return pupil.passOlymp !== true;
            });

            var i = 0,
                length = pupils.length,
                pupil;

            for (i; i < length; i++) {
                pupil = pupils[i];
                exportData.push(createExportData(pupil, examNum));
            }

            csvData = json2csv(exportData, opts);
            res.attachment('exam-seats-' + examNum + '.csv');
            res.status(200).send(csvData);
        }

        function createExportData(pupil, examNum) {
            var examName = examNum === '1' ? 'firstExamDate' : 'secondExamDate';
            var i = 0;
            var audience = '';
            var pupilAudience = pupil['audience' + examNum];
            var place = pupil['place' + examNum];
            var audienceLength = place.audience.length;
            for (i; i < audienceLength; i++) {
                if ('' + place.audience[i]._id === pupilAudience) {
                    audience = place.audience[i].name;
                }
            }
            return {
                email: pupil.email,
                firstName: pupil.firstName,
                lastName: pupil.lastName,
                profile: pupil.profile.name,
                date: prettyDate(pupil.profile[examName]),
                placeName: place.name,
                placeAddress: place.address,
                audience: audience,
            };
        }
    }

    function showSeats(req, res) {
        var self = this;
        var showFlagName = 'showExamSeats' + req.params.examNum;
        var enableFlag = false;
        var params = {
            showExamSeats1: app.siteConfig.showExamSeats1 || false,
            showExamSeats2: app.siteConfig.showExamSeats2 || false,
        };

        if (params[showFlagName] !== true) {
            enableFlag = true;
            params[showFlagName] = true;
            app.settingsController.saveSeatsFlag(params, sendResponce);
        }
        function sendResponce(err) {
            console.log('send resp');
            if (!err) {
                req.session.success =
                    'Включили рассадку <strong>' +
                    req.params.examNum +
                    '</strong> экзамена';
            } else {
                req.session.error =
                    'Не получилось(( Возникли следующие ошибки: <p>' +
                    err +
                    '</p>';
            }

            res.redirect(self.path);
        }
    }

    function hideSeats(req, res) {
        var self = this;
        var params = {
            showExamSeats1: false,
            showExamSeats2: false,
        };
        app.settingsController.saveSeatsFlag(params, sendResponce);
        function sendResponce(err) {
            if (!err) {
                req.session.success = 'Выключили рассадку';
            } else {
                req.session.error =
                    'Не получилось(( Возникли следующие ошибки: <p>' +
                    err +
                    '</p>';
            }

            res.redirect(self.path);
        }
    }

    function prettyDate(dateString) {
        var d = dateString.getDate();
        var monthNames = [
            'Января',
            'Февраля',
            'Марта',
            'Апреля',
            'Мая',
            'Июня',
            'Июля',
            'Августа',
            'Сентября',
            'Октября',
            'Ноября',
            'Декабря',
        ];
        var m = monthNames[dateString.getMonth()];
        var y = dateString.getFullYear();
        var dayNames = [
            'воскресенье',
            'понедельник',
            'вторник',
            'среда',
            'четверг',
            'пятница',
            'суббота',
        ];
        var day = dayNames[dateString.getDay()];
        return d + ' ' + m;
    }

    function toUTF8Array(str) {
        var utf8 = [];
        for (var i = 0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
            } else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(
                    0xe0 | (charcode >> 12),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f)
                );
            }
            // surrogate pair
            else {
                i++;
                // UTF-16 encodes 0x10000-0x10FFFF by
                // subtracting 0x10000 and splitting the
                // 20 bits of 0x0-0xFFFFF into two halves
                charcode =
                    0x10000 +
                    (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                utf8.push(
                    0xf0 | (charcode >> 18),
                    0x80 | ((charcode >> 12) & 0x3f),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f)
                );
            }
        }
        return utf8.join('');
    }

    

   
};

exports.PlacesController = PlacesController;
