var fs = require('fs');
var async = require('async');
var csvParse = require('csv-parse');

var BaseController = require('./baseController').BaseController;

var SubjectController = function(mongoose, app) {

    var base = new BaseController('Subject', '', mongoose, app, true);

    var resultsModel = require('../models/examResults');

    resultsModel.define(mongoose, function(){
        base.ResultsCollection = mongoose.model('ExamResults');
        base.ExamFilesCollection = mongoose.model('ExamFiles');
    });

    base.create = create;
    base.edit = edit;
    base.list = list;
    base.examresults = examresults


    base.results = {
        resultsList: resultsList,
        upload: resultsUpload,
        assign: resultsAssign,
        getPupilsForSubject: getPupilsForSubject,
        getResults: getResults,
        addPoints: addPoints
        // uploadScans: scansUpload,
        // deleteScan: deleteScan,
        
    };

    function examresults(req, res) {
        var self = this;
        var subjectId = req.params.subjectId;
        
        this.Collection.findOne({_id: subjectId}).exec(function (err, subject) {
            app.sotkaController.getSubjectStats(subjectId, function(stat) {
                res.render(self.viewPath + 'examresults.jade', {
                    stat: stat.subjectStat,
                    subject: subject,
                    siteConfig: self.app ? self.app.siteConfig : {}
                });
            })
            
        });

    }

    function list(req, res) {
        var self = this;
        this.Collection
            .find()
            //.sort('order')
            .populate('place')
            .exec(function (err, docs) {
                console.log('err, docs', err, docs)
                var examDates = self.Collection.getExamDatesArray(docs);
                                
                for(var i = 0; i < docs.length; i++) {
                    docs[i].exams = self.Collection.fillExamsArray(docs[i], examDates)
                }

                res.render(self.viewPath + 'list.jade', {
                    docs: docs,
                    examDates: examDates,
                    viewName: self.name.toLowerCase()
                });
                
            });
    }

    function create(req, res) {
        var self = this,
            doc;
        if (req.session && req.session.locals && req.session.locals.doc) {
            doc = req.session.locals.doc;
            req.session.locals = {};
        } else {
            doc = new self.Collection();
        }
        
            
        app.placesController.Collection.find(function (err, places) {

            var places = createListForSelect(places, 'id');
    
            res.render(self.viewPath + 'new.jade', {
                doc: doc,
                places: places,
                method: 'post',
                viewName: 'subject'
            });

        });

    };

    function edit(req, res) {
        var self = this;

        this.Collection.findByReq(req, res, function(doc) {
            app.placesController.Collection.find(function (err, places) {

                var places = createListForSelect(places, 'id');
       
                res.render(self.viewPath + 'new.jade', {
                    doc: doc,
                    places: places,
                    method: 'put',
                    viewName: 'subject'
                });

            });
        });

    };


    base.save = function(req, res) {
        var self = this;
        var doc = new this.Collection(req.body);
        doc.save(function(err) {
            if (err) {
                req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                req.session.locals = {doc: doc};
                res.redirect(self.path + '/create');
            }
            else {
                req.session.success = 'Предмет <strong>' + doc.name + '</strong> создан ' + doc.createdAt;
                res.redirect(self.path);
            }
        });
    };

    base.update = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){

            doc.name = req.body.name;
            doc.date = req.body.date ;
            doc.startTime = req.body.startTime ;
            doc.appelationDate = req.body.appelationDate ;
            doc.place = req.body.place;
            doc.uploaded = req.body.uploaded || false;
            doc.noStats = req.body.noStats || false ;
            doc.examKey = req.body.examKey ;
            doc.isEnabled = req.body.isEnabled || false
            doc.feedBackForm = req.body.feedBackForm
            doc.save(function(err) {
                if (err) {
                    req.session.error = 'Не получилось обновить предмет(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {doc: doc};
                    res.redirect('/admin/pupils/subjects/edit/' + doc.id);
                }
                else {
                    req.session.success = 'Предмет <strong>' + doc.name + '</strong> обновлен';
                    res.redirect(self.path);
                }
            });
        });
    };

    base.remove = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){
            var name = doc.name;
            doc.remove(function() {
                req.session.success = 'Предмет <strong>' + name + '</strong> успешно удалён';
                res.redirect(self.path);
            });
        });
    };

    base.constructor = arguments.callee;

    return base;

    function createListForSelect(array, fieldName) {
        return array.map(function (item) {
            var code = item.code ? item.code + ' - ' : '';
            return {
                name: code + item.name,
                value: item[fieldName]
            }
        });
    }

    function resultsList(req, res){
        base.Collection.findByReq(req, res, function (subject) {
            app.sotkaController.calculate(function(lastStat){
                base.ResultsCollection
                    .find({subject: req.params.id})
                    .sort('ID')
                    .exec(function(err, docs){
                        async.eachSeries(docs, function (doc, asyncdone) { 
                            app.resultScansController.Collection
                                .find({subject: req.params.id, code: doc.ID})
                                .exec(function (err, scans) {
                                    doc.scans = scans;
                                    asyncdone();
                                })          
                        }, function (err) {
                            res.render(base.viewPath + 'resultsList.jade',{
                                id: req.params.id,
                                docs: docs,
                                subject: subject,
                                lastStat:lastStat
                            });
                        })  
                    });
            })
        }); 
    }

    function resultsUpload(req, res){
        var fileData = '';
            
        fs.createReadStream(req.files.csvfile.path)
            .on('data', function(data){ 
                fileData += data;
            })
            .on('end', function(){
                fs.unlinkSync(req.files.csvfile.path);

                csvParse(fileData, {columns: true}, function(err, records) {
                    saveResults(req, res, records)
                })
            });
    }
    function saveResults(req, res, records, next) {
        var subjectId = req.params.id;
        async.eachSeries(records, function (record, asyncdone) {
            base.ResultsCollection.findByGreatCamID(record.ID, subjectId, function(err, result) {
                if (result) {
                    record.AdditionalPoints = result.AdditionalPoints;
                    updateExistingResult(result, record, subjectId, asyncdone)
                } else {
                    base.ResultsCollection.saveNewResult(record, subjectId, asyncdone)  
                }
            })
        }, function(err) {
            onAsignResultsComplete(req, res, err)
        });
    }
    function updateExistingResult(result, record, subjectId, next){
        app.pupilsController.Collection.findByResultAsigned(result._id, function(err, pupil){
            if (err) {
                next(err, pupil);
                return;
            }
            if (pupil) {
                app.pupilsController.updatePupilResults(pupil, record, function(err, doc){
                    if (err) {
                        next(err, doc)
                    } else {
                        base.ResultsCollection.updateResult(result, record, subjectId, next)
                    }
                })
            } else {
                base.ResultsCollection.updateResult(result, record, subjectId, next)
            }
       })
    }

    function onAsignResultsComplete(req, res, err) {
        if (err) {
            req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
        } else {
            req.session.success = 'Всё хорошо. Данные загрузились и сохранились';
        }
        res.redirect('/admin/pupils/subjects/results/' + req.params.id);
    }

    function getPupilsForSubject(req, res) {
        var subjectId = req.params.subjectId;
        app.pupilsController.Collection
            .findPupilsForSubject(subjectId, function(pupils) {
                console.log(pupils.length)
                res.json({
                    pupils: pupils
                })
            })
    }

    function resultsAssign(req, res) {
        base.Collection.findByReq(req, res, function (subject) {
                res.render(base.viewPath + 'resultsAssign.jade',{
                    id: req.params.id,
                    subject: subject,
                    viewName: 'resultsAssign'
                });
        });
    }

    function getResults(req, res) {
        base.ResultsCollection
            .find({subject: req.params.subjectId})
            .sort('ID')
            .exec(function(err, docs){
                res.json(docs);
            });
    }

    function addPoints(req, res) {
        var addPoinsArray = req.body.addpoints; 
        // var examNumber = req.params.examNumber;
        async.forEachOf(addPoinsArray, function(additionalPoints, id, asymcdone) {
            base.ResultsCollection
                .findOne({_id: id, subject: req.params.subjectId})
                .exec(function(err, result) {
                    var adPointsNum;
                    if (!isNaN(parseInt(additionalPoints))) {
                        adPointsNum = parseInt(additionalPoints);
                    } else {
                        adPointsNum = undefined;
                    }
                    result.AdditionalPoints = adPointsNum;
                    result.save(asymcdone)
                })
         }, function(err) {
            onAddPointsComplete(req, res, err)
         })
    }

    function onAddPointsComplete(req, res, err) {
        if (err) {
            req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
        } else {
            req.session.success = 'Всё хорошо. Дополнительные баллы сохранились';
        }
        res.redirect('/admin/pupils/subjects/results/' + req.params.subjectId );
    }
    

};



exports.SubjectController = SubjectController;