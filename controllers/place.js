var json2csv = require('json2csv').parse;
var BaseController = require('./baseController').BaseController;

var PlacesController = function (mongoose, app) {
    var base = new BaseController('Places', '', mongoose, app, true);

    var DataService = {
        generateDictionary: generateDictionary,
    };

    var Seeder = {
        seedPupilsInCorpse: seedPupilsInCorpse,
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
        app.profileController.Collection.find().exec(function (err, profiles) {
            res.render(self.viewPath + 'new.jade', {
                doc: doc,
                queryId: queryId,
                profiles: profiles,
                method: 'post',
            });
        });
    };

    base.edit = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            app.profileController.Collection.find().exec(function (
                err,
                profiles
            ) {
                res.render(self.viewPath + 'new.jade', {
                    doc: doc,
                    method: 'put',
                    profiles: profiles,
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

    return base;

    function generatePupilSeeds(req, res) {
        app.profileController.Collection.find().exec(function (err, profiles) {
            base.Collection.find().exec(function (err, places) {
                var profilesMap = createProfilesMap(profiles);
                var corpses = createCorpsesFn(places);

                var responseErrors = [];
                var responsePupils = [];
                var response = {};

                var i = 0,
                    corps;
                var belErrors;
                var seededPupils;
                var corpsesLength = corpses.length;

                for (i; i < corpsesLength; i++) {
                    belErrors = checkPlaces(corpses[i], profilesMap);
                    responseErrors = responseErrors.concat(belErrors);
                }
            });
        });

        

        if (responseErrors.length > 0) {
            console.log('responseErrors', responseErrors);
            response = {
                errors: responseErrors,
            };
        } else {
            for (i = 0; i < corpsesLength; i++) {
                seededPupils = Seeder.seedPupilsInCorpse(
                    corpses[i],
                    profilesMap
                );
                console.log(i);
                responsePupils = responsePupils.concat(seededPupils);
            }

            response = {
                corpses: corpses,
            };

            //TODO remove with save

            DataService.db.pupilsG = JSON.parse(JSON.stringify(responsePupils));
            DataService.db.corpsesG = JSON.parse(JSON.stringify(corpses));

            generateStatus = true;
            S3Service.updateDBFile();
        }
    }

    function seedPupilsInCorpse() {}

    function getGenerateStatus(req, res) {
        res.json({
            generateStatus: false,
            timestemp: Date.now(),
        });
    }

    function getCorpses(req, res) {
        var exumNum = req.params.examNum;
        base.Collection.find().exec(function (err, places) {
            var corpses = createCorpsesFn(places);
            res.json(corpses);
        });
    }

    function getDictionary(req, res) {
        base.Collection.find().exec(function (err, places) {
            app.profileController.Collection.find().exec(function (
                err,
                profiles
            ) {
                var corpses = createCorpsesFn(places);
                var data = DataService.generateDictionary({
                    corpses: corpses,
                    profiles: profiles,
                });
                res.json(data);
            });
        });
    }

    function generateDictionary(db) {
        var data = {
            corpses: {},
            places: {},
            audiences: {},
            profiles: {},
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

        return data;
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

    function seedaAppPage(req, res) {
        var self = this;
        var exumNum = req.params.examNum;

        app.profileController.Collection.find().exec(function (err, profiles) {
            var examDates = app.profileController.Collection.getExamDatesArray(
                profiles
            );

            res.render(self.viewPath + 'seedApp.jade', {
                exumNum: exumNum,
                examDate: examDates[exumNum],
            });
        });
    }

    function list(req, res) {
        var self = this;
        this.Collection.find()
            .sort('-createdAt')
            .exec(function (err, docs) {
                
                app.profileController.Collection.find().exec(function (
                    err,
                    profiles
                ) {
                    var examDates = app.profileController.Collection.getExamDatesArray(
                        profiles
                    );

                     
                    res.render(self.viewPath + 'list.jade', {
                        docs: docs,
                        profiles: profiles,
                        examDates: examDates,
                        viewName: self.name.toLowerCase(),
                        siteConfig: self.app ? self.app.siteConfig : {},
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

    function createProfilesMap(profiles) {
        var map = {};
        var i = 0;
        var length = profiles.length;
        var profile;

        for (i; i < length; i++) {
            profile = profiles[i];

            map[profile.examPlace] = profile;
        }

        return map;
    }

    function checkPlaces(corps, profilesMap) {
        var placesLength = corps.places.length;
        var profiledPupils;
        var belPupilsLength;
        var audienceForBelLang;
        var responseErrors = [];
        var i = 0, place, profileId, profile, max;
    
        for (i; i < placesLength; i++) {
            place = corps.places[i]
            profile = profilesMap[place._id];
            profileId = profile._id;
            profiledPupils = getProfiledPupils(profileId);
            belPupilsLength = profiledPupils.filter(function(pupil){
                return pupil.needBel === true
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
                    profileName: profile.name,
                    belPupilsLength: belPupilsLength,
                    audienceForBelLang: audienceForBelLang
                })
            }
        }
    
        return responseErrors;
    }
};

exports.PlacesController = PlacesController;
