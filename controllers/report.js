/*jslint plusplus: true */
(function (exports, require) {
    'use strict';

    var moment = require('moment');
    moment.locale('ru');
    var DateFormat = require('date-fns/format');
    var ruLocale = {locale: require('date-fns/locale/ru')};

    require('../modules/date.js');
    

    var ReportController;


    ReportController = function (name, path, mongoose, application, adminInPath) {
        var self = this;
        var adminPath = adminInPath ? '' : 'admin/';
        this.app = application;
        this.name = name;
        this.viewPath = this.name.toLowerCase() + '/';
        this.path = adminPath + path.toLowerCase();
        this.model = require('../models/' + this.name.toLowerCase());
        this.model.define(mongoose, function () {
            self.Collection = mongoose.model(self.name);
        });
        this.report = report;
        this.generate = generate;
        this.show = show;

    };

    function generate(req, res) {
        this.Collection
            .findOne({ _id : req.params.id})
            .exec(function(err,doc){
                res.render('reports/show.jade', {
                doc: doc
            });
        })
    }

    function show(req, res) {
        var self = this;
        var type = req.params.type;
        var data = req.query;
        console.log(data)
       // var doc = new this.Collection(req.body);
        
        if (type === '1') {
            self.app.pupilsController.Collection
                .findPupilsForSubject(data.subjectId, function (pupilsToSeed) {
                    var pupils = [];
                    pupilsToSeed.forEach(function(p) {
                        var pupil = JSON.parse(JSON.stringify(p.pupil))
                        for (var i = 0; i < pupil.results.length; i++) {
                            if (''+pupil.results[i].exam === data.subjectId) {
                                pupil.examResult = pupil.results[i]
                            }
                        }
                        pupils.push(pupil)
                    })
                    pupils= pupils.sort(function(a, b) {
                        if(a.firstName > b.firstName) {
                            return 1
                        }
                        if(a.firstName < b.firstName) {
                            return -1
                        }
                        if(a.firstName === b.firstName) {
                            return 0
                        }
                    })
                    self.app.subjectController.Collection
                        .findOne({_id: data.subjectId})
                        .exec(function(err, subject) {
                            self.app.profileController.Collection
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
                                    var subjectProfiles = subjectToProfilesMap[subject._id];
                                    var profileNames = [];
                                    for (var i = 0; i < subjectProfiles.length; i++) {
                                        profileNames.push(subjectProfiles[i].name)
                                    }
                                    self.app.committeesController.Collection
                                        .findOne({subject: data.subjectId})
                                        .exec(function(err, committee) {
                                            data.profiles = profileNames
                                            data.committee = committee;
                                            data.list = JSON.parse(JSON.stringify(pupils))
                                            data.absentList = pupils.filter(function(pupil) { 
                                                return pupil.examResult.examStatus!=='0'
                                            }); 
                                            data.num = 0;
                                            data.committee.staffArr = data.committee.staff.split(';')
                                            data.dateStr = moment(data.date).format('LL');
                                            data.entryDateStr = moment(data.entryDate).format('LL');//DateFormat(data.entryDate, '"DD" MMMM YYYY г.', ruLocale);
                                            console.log('render 1')
                                            res.render('reports/generatedReport1.jade', data);    
                                        })
                                    })
                        })

            });
        }
        if (type === '2') {
            var pupil;
            var i = 0;
            var results = [];
            var average = 0;
            var medianaPlace;

            var gistogram = [0,0,0,0,0,0,0,0,0,0];
            self.app.pupilsController.Collection
                .findPupilsForSubject(data.subjectId, function (pupilsToSeed) {
                    var pupils = [];
                    pupilsToSeed.forEach(function(p) {
                        var pupil = JSON.parse(JSON.stringify(p.pupil))
                        for (var i = 0; i < pupil.results.length; i++) {
                            if (''+pupil.results[i].exam === data.subjectId) {
                                pupil.examResult = pupil.results[i]
                            }
                        }
                        pupils.push(pupil)
                    })

                    self.app.subjectController.Collection
                        .findOne({_id: data.subjectId})
                        .exec(function(err, subject) {
                            data.list = JSON.parse(JSON.stringify(pupils));
                            data.absentList = pupils.filter(function(pupil) { 
                                return pupil.examResult.examStatus!=='0'
                            });
                            for (i ; i < pupils.length; i++) {
                                pupil = pupils[i];
                                var points;
                                var AdditionalPoints;
                                if (pupil.examResult.result && pupil.examResult.examStatus ==='0') {
                                    points = +pupil.examResult.result.Points 
                                    AdditionalPoints = pupil.examResult.result.AdditionalPoints || 0;
                                    results.push(+points + +AdditionalPoints);
                                    average = average + +points + +AdditionalPoints;
                                }
                            }
                            results.sort(function(a, b) {
                                return a - b;
                            });

                            results.map(function(points) {
                                console.log('points', points)
                                var place = Math.floor((points-1) * 0.1);
                                if(place === -1){place=0};
                                if (place > 9) {place = 9};
                                gistogram[place] = gistogram[place] + 1;
                            })
                            medianaPlace = Math.floor(results.length * 0.5);
                            data.average = Math.round(average / results.length);
                            data.mediana =  Math.round((results[medianaPlace - 1] + results[medianaPlace]) * 0.5);
                            self.app.profileController.Collection
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
                                    var subjectProfiles = subjectToProfilesMap[subject._id];
                                    var profileNames = [];
                                    for (var i = 0; i < subjectProfiles.length; i++) {
                                        profileNames.push(subjectProfiles[i].name)
                                    }


                                    self.app.sotkaController.getSubjectStats(data.subjectId, function(stat) {
                                        console.log('$$$$$$$$$', stat)
                                        // subjectAmmount: 22,
                                        // lyceum_nodejs    | [0]      subjectOlymp: 0,
                                        // lyceum_nodejs    | [0]      countTotal: 69,
                                        data.countTotal = stat.totalStat.examsMap[subject.name];
                                        data.min = stat.subjectStat.min;
                                        data.max = stat.subjectStat.max;
                                        data.pass = stat.subjectStat.pass;
                                        data.results = results;
                                        data.gistogramMax = Math.max.apply(null, gistogram);
                                        data.division = Math.ceil(data.gistogramMax/5);
                                        data.gistogramMax = data.division * 5;
                                        data.gistogram = gistogram;
                                        data.subject = subject;
                                        data.profileNames = profileNames;
                                        data.profiles = subjectProfiles;
                                        data.totalStat = stat.totalStat.result;
                                        data.examDateStr = moment(subject.date).format('D MMMM');
                            // data.profile.secondExamDateStr = moment(profile.secondExamDate).format('D MMMM');
                                        data.entryDateStr = moment(data.entryDate).format('LL');
                                        res.render('reports/generatedReport2.jade', data);
                                    });
                                });
                        });
                });
                    
        }
        if (type === '3') {
            var pupil;
            var sum;
            var i = 0;
            var results = [];
            var average = 0;
            var medianaPlace;
            var gistogram = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
            var absent = {
                f: 0,
                s: 0,
                t: 0
            }
            self.app.pupilsController.pupilsList(data.profileId).exec(function (err, list) {
                self.app.profileController.Collection.findOne({_id: data.profileId}).exec(function(err, profile) {
                    data.list = list.filter(function(pupil) { return true });         
                    list.map(function(pupil) {

                        if (pupil.exam1===-2) {
                            absent.f = absent.f + 1;
                        }
                        if (pupil.exam2===-2) {
                            absent.s = absent.s + 1;
                        }
                        if (pupil.sum===-4) {
                            absent.t = absent.t + 1;
                        }
                    }); 
                    
                    for (i ; i < list.length; i++) {
                        pupil = list[i];
                        if (pupil.sum > -1) {
                            sum = +pupil.sum;
                            if (pupil.exam1 < 0 || pupil.exam2 < 0) {
                                sum = sum + 2;
                            }
                            results.push(+sum);
                            average = average + +sum;
                        }
                    }

                    results.sort(function(a, b) {
                        return a - b;
                    });
                    results.map(function(points) {
                        var place = Math.floor((points-1) * 0.1);
                        if(place === -1){place=0};
                        gistogram[place] = (gistogram[place] || 0) + 1;
                    })

                    medianaPlace = Math.floor(results.length * 0.5);
                    data.absent = absent
                    data.average = Math.round(average / results.length);
                    data.mediana =  Math.round((results[medianaPlace - 1] + results[medianaPlace]) * 0.5);
                    data.min = profile.minT;
                    data.max = profile.maxT;
                    data.pass = profile.passT;
                    data.results = results;
                    data.gistogramMax = Math.max.apply(null, gistogram);                    
                    data.division = Math.ceil(data.gistogramMax/5);
                    data.gistogramMax = data.division * 5;
                    data.gistogram = gistogram;
                    data.profile = profile;
                    data.profile.firstExamDateStr = moment(profile.firstExamDate).format('D MMMM');
                    data.profile.secondExamDateStr = moment(profile.secondExamDate).format('D MMMM');
                    data.entryDateStr = moment(data.entryDate).format('LL');
                    res.render('reports/generatedReport3.jade', data);    
                });
            });
                    
        }
        
    }

    function report (req, res) {
        var self = this;
            res.render( 'reports/report.jade', {
                viewName: self.name.toLowerCase(),
                siteConfig: self.app ? self.app.siteConfig : {}
            });
    };


  exports.ReportController = ReportController;
}(exports, require));
