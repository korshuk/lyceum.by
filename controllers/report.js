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
            var examNum = 'exam'+data.examNumber;
            self.app.pupilsController.pupilsList(data.profileId).exec(function (err, list) {
                self.app.subjectController.Collection.findOne({name: data.subject}).exec(function(err, subject) {
                    self.app.committeesController.Collection.findOne({subject: subject.id}).exec(function(err, committee) {
                        data.committee = committee;
                        data.list = list.filter(pupil => true);         
                        data.absentList = list.filter(pupil => pupil[examNum]===-2); 
                        data.withoutExams = list.filter(pupil => pupil[examNum]===-1); 
                        data.num = 0;
                        data.committee.staffArr = data.committee.staff.split(';')
                        console.log(data.absentList)
                        data.dateStr = moment(data.date).format('LL');
                        data.entryDateStr = moment(data.entryDate).format('LL');//DateFormat(data.entryDate, '"DD" MMMM YYYY г.', ruLocale);
                        res.render(`reports/generatedReport${type}.jade`, data);    
                    })
                })
                
                
            });
        }
        if (type === '2') {
            var examNum = 'exam'+data.examNumber;
            var pupil;
            var i = 0;
            var results = [];
            var average = 0;
            var medianaPlace;
            var examName = data.examNumber === '1' ? 'F': 'S';
            var gistogram = [0,0,0,0,0,0,0,0,0,0];
            self.app.pupilsController.pupilsList(data.profileId).exec(function (err, list) {
                self.app.profileController.Collection.findOne({_id: data.profileId}).exec(function(err, profile) {
                    console.log(profile)
                    data.list = list.filter(pupil => true);         
                    data.absentList = list.filter(pupil => pupil[examNum]===-2); 
                    for (i ; i < list.length; i++) {
                        pupil = list[i];
                        if (pupil[examNum] > -1) {
                            results.push(+pupil[examNum]);
                            average = average + +pupil[examNum];
                        }
                    }

                    results.sort(function(a, b) {
                        return a - b;
                    });
                    results.map(function(points) {
                        var place = Math.floor(points * 0.1);
                        gistogram[place] = gistogram[place] + 1;
                    })

                    medianaPlace = Math.floor(results.length * 0.5);
                    data.average = Math.floor(average / results.length);
                    data.mediana =  Math.floor((results[medianaPlace - 1] + results[medianaPlace]) * 0.5);
                    data.min = profile[`min${examName}`];
                    data.max = profile[`max${examName}`];
                    data.pass = profile[`pass${examName}`];
                    console.log('res', results, examName, data.examNumber)
                    data.results = results;
                    data.gistogram = gistogram;
                    data.profile = profile;
                    data.profile.firstExamDateStr = moment(profile.firstExamDate).format('D MMMM');
                    data.profile.secondExamDateStr = moment(profile.secondExamDate).format('D MMMM');
                    data.entryDateStr = moment(data.entryDate).format('LL');
                    res.render(`reports/generatedReport${type}.jade`, data);    
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
