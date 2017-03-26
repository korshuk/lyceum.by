var BaseController = require('./baseController').BaseController,
    translit = require('../modules/translit').translit;

var PageController = function (mongoose, application) {

    var base = new BaseController('Page', 'pages', mongoose, application);

    application.menuController.generate(base.Collection);

    base.list = function (req, res) {
        var self = this;
        res.render(self.viewPath + 'list.jade', {
            pages: req.app.menuController.JSON.children,
            viewName: 'pages'
        });
    };

    base.remove = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            var name = doc.name;
            doc.remove(function () {
                application.menuController.generate(self.Collection);
                req.session.success = 'Страница <strong>' + name + '</strong> успешно удалёна';
                res.redirect(self.path);
            });
        });
    };

    base.update = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            doc.name.ru = req.body['name.ru'];
            doc.name.by = req.body['name.by'];
            doc.name.en = req.body['name.en'];

            doc = self.sirToJsonDoc(doc, req, 'body');
            doc = self.checkWidth(doc);

            doc.parentpage = req.body['parentpage'];
            doc.pathAlias = req.body['pathAlias'];
            doc.order = req.body['order'] || 0;
            doc.updatedAt = new Date();
            doc.save(function (err) {
                if (err) {
                    req.session.error = 'Не получилось обновить страницу(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {
                        doc: doc
                    };
                    res.redirect(self.path + '/' + doc.id + '/edit');
                } else {
                    application.menuController.generate(self.Collection);
                    req.session.success = 'Страница <strong>' + doc.name + '</strong> обновлена';
                    res.redirect(self.path);
                }
            });
        });
    };

    base.save = function (req, res) {
        var self = this;
        console.log(req.body);
        console.log(JSON.parse(req.body['body.ru']));
        self.sirToJson(req, 'body');
        console.log(req.body);
        var doc = new this.Collection(req.body);
        doc = self.checkWidth(doc);
        if (doc.name['ru']) {
            doc.pathAlias = translit(doc.name['ru']);
        }
        doc.save(function (err) {
            if (err) {
                console.log('save');
                console.log(doc);
                req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                req.session.locals = {
                    doc: doc
                };
                res.redirect(self.path + '/create');
            } else {
                application.menuController.generate(self.Collection);
                req.session.success = 'Страница <strong>' + doc.name.ru + '</strong> создана ' + doc.createdAt;
                res.redirect(self.path);
            }
        });
    };

    base.parentsHelper = function (req, res, next) {
        res.locals.parents = application.menuController.List;
        next();
    };

    base.constructor = arguments.callee;

    return base;
};

exports.PageController = PageController;