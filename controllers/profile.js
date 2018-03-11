var BaseController = require('./baseController').BaseController;

var ProfileController = function (mongoose, app) {

    var base = new BaseController('Profiles', '', mongoose, app, true);

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

            doc.firstUploaded = req.body.firstUploaded === 'on';
            doc.firstExamNoStats = req.body.firstExamNoStats === 'on';
            doc.secondUploaded = req.body.secondUploaded === 'on';
            doc.totalUploaded = req.body.totalUploaded === 'on';
            doc.olympExams = [];

            doc.order = req.body.order;
            doc.belLang = req.body.belLang === 'on';
            for (subject in req.body.olympExams) {
                console.log(subject, req.body.olympExams[subject]);
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