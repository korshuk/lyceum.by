var BaseController = require('./baseController').BaseController;

var CommitteesController = function(mongoose, app) {

    var base = new BaseController('Committees', '/admin/pupils/committees', mongoose, app, true);
    
    base.list = function (req, res) {
        var self = this;
        this.Collection
            .find()
            .populate('subject')
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

            subjects = createListForSelect(subjects, 'id');

            res.render(self.viewPath + 'new.jade', {
                doc: doc,
                subjects: subjects,
                method: 'post',
                viewName: 'committee'
            });
        });
    };

    base.edit = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            app.subjectController.Collection.find(function (err, subjects) {

                subjects = createListForSelect(subjects, 'id');

                res.render(self.viewPath + 'new.jade', {
                    doc: doc,
                    subjects: subjects,
                    method: 'put',
                    viewName: 'committee'
                });
            });
        });
    };


    base.save = function(req, res) {
        var self = this;
        var doc = new this.Collection(req.body);
       
        doc.save(function(err) {
            console.log('self.path',req.body, self.path)
            if (err) {
                req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                req.session.locals = {doc: doc};
                res.redirect(self.path + '/create');
            }
            else {
                req.session.success = 'Комиссия создана';
                res.redirect(self.path);
            }
        });
    };

    base.update = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){
            doc.subject = req.body.subject;
            doc.head = req.body.head;
            doc.staff = req.body.staff;
            console.log(req.body, doc)
            doc.save(function(err) {
                if (err) {
                    req.session.error = 'Не получилось обновить комиссию(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {doc: doc};
                    res.redirect(self.path + '/' + doc.id + '/edit');
                }
                else {
                    req.session.success = 'Комиссия обновлена';
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
                req.session.success = 'Комиссия успешно удалёна';
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



exports.CommitteesController = CommitteesController;