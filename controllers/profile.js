var BaseController = require('./baseController').BaseController;
var fs = require('fs'),
    async = require('async'),
    csv = require('csv-parser');

var ProfileController = function (mongoose, app) {

    var base = new BaseController('Profiles', '', mongoose, app, true);
    var fileModel = require('../models/examfiles'), 
        resultsModel = require('../models/examResults'),
        FilesCollection,
        ResultsCollection;
    fileModel.define(mongoose, function () {
        FilesCollection = mongoose.model('ExamFiles');
    });
    resultsModel.define(mongoose, function(){
        ResultsCollection = mongoose.model('ExamResults');
    });
    base.ResultsCollection = ResultsCollection;

    base.list = function (req, res) {
        var self = this;
        this.Collection
            .find()
            .sort('-createdAt')
            .populate('examPlace')
            .exec(function (err, docs) {
                res.render(self.viewPath + 'list.jade', {
                    docs: docs,
                    viewName: self.name.toLowerCase()
                });
            });
    };

    base.create = function (req, res) {
        var self = this,
            doc;
        if (req.session && req.session.locals && req.session.locals.doc) {
            doc = req.session.locals.doc;
            req.session.locals = {};
        } else {
            doc = new self.Collection();
        }
        app.subjectController.Collection.find(function (err, subjects) {

            subjects = createListForSelect(subjects, 'name');

            app.placesController.Collection.find(function (err, places) {

                places = createListForSelect(places, 'id');

                res.render(self.viewPath + 'new.jade', {
                    doc: doc,
                    subjects: subjects,
                    places: places,
                    method: 'post',
                    viewName: 'profile'
                });
            });
        });
    };

    base.edit = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            app.subjectController.Collection.find(function (err, subjects) {

                subjects = createListForSelect(subjects, 'name');

                app.placesController.Collection.find(function (err, places) {

                    places = createListForSelect(places, 'id');

                    res.render(self.viewPath + 'new.jade', {
                        doc: doc,
                        subjects: subjects,
                        places: places,
                        method: 'put',
                        viewName: 'profile'
                    });
                });
            });
        });
    };

    base.save = function (req, res) {
        var self = this;
        var doc = new this.Collection(req.body);
        doc.olympExams = [];
        for (subject in req.body.olympExams) {
            doc.olympExams.push(subject);
        }
        doc.save(function (err) {
            if (err) {
                req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                req.session.locals = {doc: doc};
                console.log(err);
                res.redirect(self.path + '/create');
            }
            else {
                req.session.success = 'Профиль <strong>' + doc.name + '</strong> создан ' + doc.createdAt;
                res.redirect(self.path);
            }
        });
    };

    base.update = function (req, res) {
        var self = this;

        this.Collection.findByReq(req, res, function (doc) {
            doc.name = req.body.name;
            doc.code = req.body.code;
            doc.subcode = req.body.subcode;
            doc.ammount = req.body.ammount;

            doc.examPlace = req.body.examPlace;

            doc.firstExamName = req.body.firstExamName;
            doc.firstExamDate = req.body.firstExamDate;
            doc.firstExamAppelationDate = req.body.firstExamAppelationDate;
            doc.firstIsFirst = req.body.firstIsFirst === 'on';
            doc.secondExamName = req.body.secondExamName;
            doc.secondExamDate = req.body.secondExamDate;
            doc.secondExamAppelationDate = req.body.secondExamAppelationDate;

            doc.secondExamPlace = req.body.secondExamPlace;
            doc.firstExamPlace = req.body.firstExamPlace;

            doc.firstUploaded = req.body.firstUploaded === 'on';
            doc.firstExamNoStats = req.body.firstExamNoStats === 'on';
            doc.secondUploaded = req.body.secondUploaded === 'on';
            doc.totalUploaded = req.body.totalUploaded === 'on';
            doc.olympExams = [];

            doc.order = req.body.order;
            doc.belLang = req.body.belLang === 'on';
            for (subject in req.body.olympExams) {
                doc.olympExams.push(subject);
            }
            doc.save(function (err) {
                if (err) {
                    req.session.error = 'Не получилось обновить профиль(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {doc: doc};
                    res.redirect(self.path + '/edit/' + doc.id);
                }
                else {
                    req.session.success = 'Профиль <strong>' + doc.name + '</strong> обновлен';
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
                req.session.success = 'Профиль <strong>' + name + '</strong> успешно удалён';
                res.redirect(self.path);
            });
        });
    };

    base.createFiles = function (req, res) {
        var self = this;
        FilesCollection.find({profileId: req.params.id, numberexzam: req.params.number}).sort('name').exec(function(err, docs){
            res.render(self.viewPath + 'addFiles.jade', {
                number: req.params.number,
                id: req.params.id,
                docs: docs,
            });
        });
    };
    
    base.uploadFiles = function (req, res) {
        var files = [],
            filesArray = req.files,
            number = parseInt(req.body.startnumber),
            isFinish = false,
            url,
            newFile,
            insertFile;
        for(var i = 0; i < filesArray.length; i++){
            if (i === filesArray.length - 1) isFinish = !isFinish;
            url = "/files/" + filesArray[i].filename;
            newFile = {name: number, url: url, numberexzam: req.params.number, profileId: req.params.id, isFinish: isFinish };
            files.push(newFile);
            number++;
        }
        async.each(files, function (newfile, callback){
            ResultsCollection.find({profileId: req.params.id, numberexzam: req.params.number, StudentId: newfile.name}, function(err, docs){
                var resDoc;
                if (docs[0]){
                    resDoc = docs[0];
                    newFile.resultId = resDoc.id;
                }
                insertFile = new FilesCollection(newfile);
                insertFile.save(function (err, doc) {
                    if (err) {
                        req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                        console.log(err);
                    }                                   
                    if (resDoc) {
                        resDoc.imageId = doc._id;
                        resDoc.save(function(err){
                            if (err) console.log(err);
                            return;
                        });
                    } 
                    callback(newFile.isFinish);
                });           
            });
        }, function(result){
            if (result) base.createFiles(req, res);
        });
    }

    base.deleteFile = function (id, isFinish, req, res){
        FilesCollection.find({_id: id}, function(err, docs){
            var doc = docs[0];
            req.params.id = doc.profileId;
            req.params.number = doc.numberexzam;
            fs.unlink('./public'+doc.url, function(err) {
                if (err){
                    console.log(err);
                }
            });
            doc.remove(function(err){
                if (err) console.log(err);
            });
            if (isFinish) base.createFiles(req, res);
        });
    }

    base.deleteFiles = function (req, res) {
        FilesCollection.find({profileId: req.params.id, numberexzam: req.params.number}, function(err, docs){
            if (err){
                console.log(err);
                return;
            }
            var isFinish = false;
            for(var i = 0; i < docs.length; i++){
                if (i === docs.length - 1) isFinish = !isFinish;
                base.deleteFile(docs[i]._id, isFinish, req, res);            
            }
        });
    }

    base.createFile = function (req, res){
        var self = this;
        FilesCollection.find({_id: req.params.id}, function(err, doc){
            res.render(self.viewPath + 'editFile.jade', {
                doc: doc[0],
            });
        });
    }

    base.uploadFile = function (req, res){
        var newFile;
        newFile = {
            name: req.body.name,
        };
        if (req.files[0]){
            FilesCollection.find({_id: req.params.id},function(err, docs){
                fs.unlink('./public/'+docs[0].url, function(err){
                    if (err) console.log(err);
                });
            })
            newFile.url = '/files/' + req.files[0].filename;
        }
        FilesCollection.findOneAndUpdate({_id: req.params.id}, newFile, function(err, doc){
            if (err) console.log(err);
            req.params.id = doc.profileId;
            req.params.number = doc.numberexzam;
            ResultsCollection.find({profileId: req.params.id, numberexzam: req.params.number, StudentId: doc.name}, function(err, docs){
                if (docs){
                    var resDoc = docs[0];
                    doc.resultId = resDoc._id;
                    doc.save(function(err, result){
                        if (err) console.log(err);
                        resDoc.imageId = result._id;
                        resDoc.save(function(err){
                            if (err) console.log(err);
                        });
                    });
                }
            });
            base.createFiles(req, res);
        });
    }

    base.createResults = function (req, res){
        var self = this;
        ResultsCollection.find({profileId: req.params.id, numberexzam: req.params.number}).populate('imageId').sort('StudentId').exec(function(err, docs){
            res.render(self.viewPath + 'addResults.jade',{
                id: req.params.id,
                number: req.params.number,
                docs: docs
            });
        });
    }

    base.uploadResults = function (req, res){
        var newResult, 
            doc;
        ResultsCollection.find({profileId: req.params.id, numberexzam: req.params.number}, function(err, docs){
            if (docs.length > 0){
                if (docs[0].url) {
                    fs.unlink('./'+docs[0].url, function(err){
                        if (err) console.log(err);
                    });
                }
                for (var i = 0; i < docs.length; i++){
                    doc = docs[i];
                    doc.remove(function(err){
                        if (err) console.log(err);
                    });
                }
            }
        });
        fs.createReadStream(req.files[0].path)
            .pipe(csv())
            .on('data', function(data){ 
                data.numberexzam = req.params.number;
                data.profileId = req.params.id;
                data.url = req.files[0].path;
                data.StudentId = data.ID;
                FilesCollection.find({ name: data.StudentId, numberexzam: req.params.number, profileId: req.params.id}, function(err, docs){
                    if (docs[0]){
                        data.imageId = docs[0]._id;
                    }
                    newResult = new ResultsCollection(data);
                    newResult.save(function(err, doc){
                        if (err) console.log(err);
                        console.log(doc);
                    });
                });
            })
            .on('end', function(){
                base.createResults(req, res);
            });
    }

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
};


exports.ProfileController = ProfileController;