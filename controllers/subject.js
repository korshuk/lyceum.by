var BaseController = require('./baseController').BaseController;

var SubjectController = function(mongoose, app) {

    var base = new BaseController('Subject', '', mongoose, app, true);

    base.create = create;
    base.edit = edit;
    base.list = list;

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
};



exports.SubjectController = SubjectController;