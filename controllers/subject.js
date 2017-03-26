var BaseController = require('./baseController').BaseController;

var SubjectController = function(mongoose, app) {

    var base = new BaseController('Subject', '', mongoose, app, true);

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

            doc.save(function(err) {
                if (err) {
                    req.session.error = 'Не получилось обновить предмет(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {doc: doc};
                    res.redirect(self.path + '/' + doc.id + '/edit');
                }
                else {
                    req.session.success = 'Предмет <strong>' + doc.name.ru + '</strong> обновлен';
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
};



exports.SubjectController = SubjectController;