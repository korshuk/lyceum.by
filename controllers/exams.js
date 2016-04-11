var BaseController = require('./baseController').BaseController;
var Parse = require('csv-parse');
var fs = require('fs'),
    mongoose = require('mongoose');


var passportTranslater = {
    'К': 'K',
    'Е': 'E',
    'Н': 'H',
    'Х': 'X',
    'В': 'B',
    'А': 'A',
    'Р': 'P',
    'О': 'O',
    'С': 'C',
    'М': 'M',
    'Т': 'T'
};

ExamsController = function(mongoose) {
    var self = this;
    var vid = 0;

    this.examDatasModel = require('../models/examDatas');
    this.examDatasModel.define(mongoose, function() {
        self.examDatasCollection = mongoose.model('ExamDatas');
    });


    this.profilesModel = require('../models/profiles');
    this.profilesModel.define(mongoose, function() {
        self.profilesCollection = mongoose.model('Profiles');
    });

    var base = new BaseController('Exam', 'exams', mongoose);

    function onNewRecord(records, number, req, res) {
        var record = records[number];
        
        var i = record.passport.length;
        var passportString = record.passport;
        while (i--) {
            if (passportTranslater[passportString[i]]) {
                passportString = passportString.substr(0, i) + passportTranslater[passportString[i]] + passportString.substr(i+1);
            }
        }
        record.passport = passportString;
        var sum;
        base.Collection.findOne({ passport: record.passport }, function(err, doc) {
            if (err) {
                console.log('find error');
                return;
            }
            if (!doc) {
                doc = new base.Collection();
                doc.passport = record.passport;
                doc.data = [];
            }
            sum = +records[number].exam1 + +records[number].exam2;
            if (isNaN(sum)) {
                console.log(isNaN);
            }
            if (isNaN(+records[number].exam1)) {
                records[number].exam1 = -1;
                sum = -1;
                console.log(records[number].exam1);
            }
            if (isNaN(sum)) {
                sum = -1;
            }

            doc.data.push({
                vid: vid,
                lastname: records[number].lastname,
                firstname: records[number].firstname,
                patronymic: records[number].patronymic,
                profile: records[number].profile,
                subcode: records[number].subcode,
                pass: !!records[number].pass,
                exam1: +records[number].exam1,
                exam2: +records[number].exam2,
                sum: sum
            });


            doc.save(function(err, d) {
                if (err) {
                    console.log('doc save err', err);
                    //TODO error handle
                }
                else {
                    number = number + 1;

                    if (records.length > number) {
                        console.log(number, records[number].num);
                        onNewRecord(records, number, req, res);
                    }
                    else {
                        done(req, res);
                    }
                }

            });
        });
    }

    function onError(error) {
        console.log('error', error);
    }

    function statistics(next) {
        base.Collection.find().exec(function(err, docs) {
            var profiles = {};
            var data, i;
            for (i = docs.length - 1; i >= 0; i--) {
                if (docs[i].data && docs[i].data.length > 0) {
                    data = docs[i].data[docs[i].data.length - 1];

                    if (data.profile) {
                        if (!profiles[data.profile]) {
                            profiles[data.profile] = {
                                resultsF: [],
                                resultsS: [],
                                resultsT: [],
                                olimp: 0,
                            };
                        }
                        if (data.pass) {
                            profiles[data.profile].olimp = profiles[data.profile].olimp + 1;
                        } else {
                            if (data.sum > -1) {
                                profiles[data.profile].resultsF.push(+data.exam1);
                                profiles[data.profile].resultsS.push(+data.exam2);
                                profiles[data.profile].resultsT.push(+data.sum);
                            }
                        }
                    }
                }
            }
            var best;
            var counter;
            var indexOfPass;
            var lastIndexOf;
            var profile;
            var passed;
            self.profilesCollection.find().exec(function(err, docsP) {
                if (err) {
                    console.log(err);
                } else {
                    counter = docsP.length;
                    for (i = docsP.length - 1; i >= 0; i--) {
                        profiles[docsP[i].code].resultsF.sort(function(a, b) {
                            return a - b;
                        });
                        profiles[docsP[i].code].resultsS.sort(function(a, b) {
                            return a - b;
                        });
                        profiles[docsP[i].code].resultsT.sort(function(a, b) {
                            return a - b;
                        });
                        best = docsP[i].ammount - profiles[docsP[i].code].olimp;

                        if (best < 0) {
                            best = 0;
                        }

                        passed = best;
                        docsP[i].olimp = profiles[docsP[i].code].olimp;
                        docsP[i].minF = profiles[docsP[i].code].resultsF[0];
                        docsP[i].maxF = profiles[docsP[i].code].resultsF[profiles[docsP[i].code].resultsF.length - 1];
                        docsP[i].passF = profiles[docsP[i].code].resultsF[profiles[docsP[i].code].resultsF.length - best];

                        docsP[i].minS = profiles[docsP[i].code].resultsS[0];
                        docsP[i].maxS = profiles[docsP[i].code].resultsS[profiles[docsP[i].code].resultsS.length - 1];
                        docsP[i].passS = profiles[docsP[i].code].resultsS[profiles[docsP[i].code].resultsS.length - best];

                        docsP[i].minT = profiles[docsP[i].code].resultsT[0];
                        docsP[i].maxT = profiles[docsP[i].code].resultsT[profiles[docsP[i].code].resultsT.length - 1];
                        docsP[i].passT = profiles[docsP[i].code].resultsT[profiles[docsP[i].code].resultsT.length - best];
                        
                        indexOfPass = profiles[docsP[i].code].resultsT.indexOf(docsP[i].passT);
                        lastIndexOf = profiles[docsP[i].code].resultsT.lastIndexOf(docsP[i].passT);
                        
                        if (lastIndexOf - indexOfPass > 0) {
                            docsP[i].halfpass = docsP[i].passT;
                            console.log(docsP[i].halfpass);
                            docsP[i].passT = profiles[docsP[i].code].resultsT[lastIndexOf + 1];
                            passed = profiles[docsP[i].code].resultsT.length - lastIndexOf - 1;

                            docsP[i].halfDelta = docsP[i].ammount - passed - docsP[i].olimp;
                            docsP[i].halfPupils = lastIndexOf - indexOfPass + 1;

                            if (docsP[i].halfDelta == docsP[i].halfPupils) {
                                docsP[i].halfpass = null;
                                docsP[i].halfDelta = 0;
                                docsP[i].halfPupils = 0;
                            }

                        } else {
                            docsP[i].halfDelta = 0;
                            docsP[i].halfPupils = 0;
                        }
            
                        docsP[i].save(function() {
                            counter = counter - 1;
                            if (counter == 0 && next) {
                                next();
                            }
                        });
                    }
                }
            });
        });
    }

    function done(req, res) {
        var date = new Date();
        data = new self.examDatasCollection();
        data.date = date;
        data.vid = vid;
        data.save(function(err, data) {
            if (err) {
                console.log('data version save err', err);
                //TODO error handle
            }
            else {
                statistics(function() {
                    res.redirect('/admin/exams');
                });
            }
        });
    }

    function parseCSVFile(req, res) {

        var records = [];
        var source = fs.createReadStream(req.files.csvTable.path);

        var parser = Parse({
            delimiter: ',',
            columns: true
        });

        parser.on("readable", function() {
            var record;
            while (record = parser.read()) {
                records.push(record);
            }
        });

        parser.on("error", function(error) {
            onError(error);
        });

        parser.on("end", function() {
            self.examDatasCollection.find().sort('-date').limit(1).exec(function(err, doc) {
                console.log(doc, vid);
                if (doc.length > 0) {
                    console.log('if (doc)', vid);
                    vid = doc[0].vid + 1;
                    console.log('if (doc)', vid);
                }
                if (records.length) {
                    onNewRecord(records, 0, req, res);
                }
            });
        });

        source.pipe(parser);
    }

    function versionDelete(req, res, next) {
        for (var i = req.docs[req.number].data.length - 1; i >= 0; i--) {
            if (req.docs[req.number].data[i].vid == req.vid) {
                req.docs[req.number].data.splice(i, 1);
                req.docs[req.number].save(function (err) {
                    console.log('errrrrr', arguments);
                });
            }
        }
        req.number = req.number + 1;
        if (req.number < req.docs.length) {
            versionDelete(req, res, next);
        }
        else {
            if (next) {
                next(req, res);
            }
        }
    }

    function versionDeleteCallback(req, res) {
        req.examData.remove(function() {
            res.redirect('/admin/exams');
        });
    }

    base.list = function(req, res) {
        res.render(base.viewPath + 'list.jade');
    };

    base.versionList = function(req, res) {
        self.examDatasCollection.find().exec(function(err, docs) {
            res.json(docs);
        });
    };

    base.deleteversion = function(req, res) {
        self.examDatasCollection.findOne({ '_id': req.params.id }, function(err, doc) {
            if (err) {
                console.log('deleteversion find err', err);
                //TODO error handle 
            }
            else {
                console.log(169, doc.vid);
                req.vid = doc.vid;
                req.examData = doc;
                base.Collection.find().exec(function(err, docs) {
                    req.docs = docs;
                    req.number = 0;
                    versionDelete(req, res, versionDeleteCallback);
                });

            }
        });

    };

    base.resultsUpload = function(req, res) {
        var filePath = req.files.csvTable.path;
        parseCSVFile(req, res);
    };

    base.listRest = function(req, res) {
        base.Collection.find().exec(function(err, docs) {
            if (err) {
                res.send(err);
            }
            var response = [];
            for (var i = docs.length - 1; i >= 0; i--) {
                docs[i].data = docs[i].data[docs[i].data.length - 1];
                response.push(docs[i]);
            };

            res.json(docs);
        });
    };

    base.getExam = function(req, res) {
        base.Collection.findOne({ '_id': req.params.id }, function(err, doc) {
            if (err) {
                res.send(err);
                //TODO error handle
            }
            else {
                res.json(doc);
            }
        })
    };

    processResultRequest = function(req, res, data, profile) {
        var date = new Date;

        var firstExamDate = profile.firstIsFirst ? profile.firstExamDate : profile.secondExamDate;
        var secondExamDate = profile.firstIsFirst ? profile.secondExamDate : profile.firstExamDate;

        var requestData = {
            data: data,
            profile: profile,
        };

        var templateName = 'results/';
        //TODO check empty firstExamDeate
        console.log(date, firstExamDate, date < firstExamDate);
        if (data.pass) {
            templateName = templateName + 'olymp'
        } else {
            if (date < firstExamDate) {
                templateName = templateName + 'bF'
            }
            if (date >= firstExamDate && date < secondExamDate) {
                templateName = templateName + (profile.firstExamUploaded ? 'aFbS' : 'aFbSnoR');
            }
            if (date >= secondExamDate) {
                if (profile.totalExamUploaded) {
                    templateName = templateName + 'Total'
                } else {
                    templateName = templateName + (profile.secondExamUploaded ? 'aS' : 'aSnoR');
                }
            }
        }
        res.render(base.viewPath + templateName, requestData);
    };

    base.getResult = function(req, res) {
        base.Collection.findOne({ 'passport': req.body.passport }, function(err, doc) {
            if (err) {
                res.send(err);
            }
            else {
                if (doc) {
                    self.profilesCollection.find({ 'code': doc.data[doc.data.length - 1].profile }, function(err, profiles) {
                        console.log(12, doc, profiles)
                        var profile;
                        if (err) {
                            res.send(err);
                        } else {
                            if (profiles.length > 1) {
                                for (var i = 0; i < profiles.length; i++) {
                                    if (profiles[i].subcode == doc.data[doc.data.length - 1].subcode) {
                                        profile = profiles[i];
                                    }
                                }
                            }
                            else {
                                profile = profiles[0];
                            }
                            processResultRequest(req, res, doc.data[doc.data.length - 1], profile);
                        }
                    });

                } else {
                    res.json({
                        errorMessage: 'not found'
                    })
                }

            }
        })
    };


    base.updateExam = function(req, res) {
        base.Collection.findOne({ '_id': req.params.id }, function(err, doc) {
            if (err) {
                res.send(err);
            }
            else {
                doc.passport = req.body.passport;
                doc.data = req.body.data;
                doc.data[doc.data.length - 1].pass = doc.data[doc.data.length - 1].pass == 'true';
                doc.data[doc.data.length - 1].sum = +doc.data[doc.data.length - 1].exam1 + +doc.data[doc.data.length - 1].exam2;
                doc.save(function(err, result) {
                    console.log('ssssss', result);
                    if (err) {
                        res.send(err);
                    }
                    else {
                        statistics(function() {
                            res.json(result);
                        });
                    }

                });
            }
        });
    };

    base.deleteExam = function(req, res) {
        base.Collection.findOne({ '_id': req.params.id }, function(err, doc) {
            if (err) {
                res.send(err);
            }
            else {
                doc.remove(function(err, result) {
                    if (err) {
                        res.send(err);
                    }
                    else {
                        statistics(function() {
                            res.json('ok');
                        });
                    }
                });
            }
        });
    };

    base.getProfiles = function(req, res) {
        self.profilesCollection.find().exec(function(err, docs) {
            if (err) {
                res.send(err);
            }
            res.json(docs);
        });
    };

    base.addProfile = function(req, res) {
        var doc = new self.profilesCollection(req.body);
        doc.save(function(err, result) {
            if (err) {
                res.send(err);
            }
            else {
                base.getProfiles(req, res);
            }
        });
    };

    base.updateProfile = function(req, res) {
        self.profilesCollection.findByIdAndUpdate(req.params.id, req.body, function(err, doc) {
            if (err) {
                res.send(err);
            }
            else {
                statistics(function() {
                    base.getProfiles(req, res);
                })
            }
        });
    };

    base.deleteProfile = function(req, res) {
        self.profilesCollection.findOne({ '_id': req.params.id }, function(err, doc) {
            if (err) {
                res.send(err);
            }
            else {
                doc.remove(function() {
                    statistics(function() {
                        base.getProfiles(req, res);
                    });
                });
            }
        });
    };

    base.constructor = arguments.callee;

    return base;
};

exports.ExamsController = ExamsController;