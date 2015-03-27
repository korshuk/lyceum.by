(function (exports, require) {
    'use strict';
    require('../modules/date.js');
    
    var BaseController = require('./baseController').BaseController,
        NewsController;

    

    NewsController = function (mongoose) {

        var base = new BaseController('News', 'news', mongoose);

        base.remove = function (req, res) {
            var self = this;
            this.Collection.findByReq(req, res, function (doc) {
                doc.remove(function () {
                    req.session.success = 'Новость успешно удалена';
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
                doc.image = req.body['image'];

                doc = self.sirToJsonDoc(doc, req, 'body');
                doc = self.sirToJsonDoc(doc, req, 'teaser');

                doc = self.checkWidth(doc);
                doc.isMain = req.body['isMain'];
                doc.createdAt = req.body['createdAt'];
                doc.pathAlias = doc.createdAt.format('ddMMyyyyhhmmss');
                doc.updatedAt = new Date();
                doc.save(function (err) {
                    if (err) {
                        req.session.error = 'Не получилось обновить новость(( Возникли следующие ошибки: <p>' + err + '</p>';
                        req.session.locals = {
                            doc: doc
                        };
                        res.redirect(self.path + '/' + doc.id + '/edit');
                    } else {
                        req.session.success = 'Новость <strong>' + doc.createdAt.format('dd-MM-yyyy hh:mm:ss') + '</strong> обновлена';
                        res.redirect(self.path);
                    }
                });
            });
        };



        base.save = function (req, res) {
            var self = this,
                doc,
                date = new Date();

            self.sirToJson(req, 'body');
            self.sirToJson(req, 'teaser');

            doc = new this.Collection(req.body);
            doc.pathAlias = date.format('ddMMyyyyhhmmss');
            doc = self.checkWidth(doc);

            doc.save(function (err) {
                if (err) {
                    req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {
                        doc: doc
                    };
                    res.redirect(self.path + '/create');
                } else {
                    req.session.success = 'Новость от <strong>' + doc.createdAt.format('dd-MM-yyyy hh:mm:ss') + '</strong> создана';
                    res.redirect(self.path);
                }
            });
        };

        base.apiList = function (req, res) {
            this.getList(0, function (err, docs, main) {
                res.send(docs);
            });
        };

        base.showList = function (req, res) {
            var self = this;
            this.getList(0, function (err, docs, main) {
                res.render(self.viewPath + 'frontlist.jade', {
                    docs: docs,
                    main: main
                });
            });
        };

        base.moreList = function (req, res) {
            var self = this;
            this.getList(req.params.page, function (err, docs, main) {
                if (docs.length > 0) {
                    res.render(self.viewPath + 'indexlist.jade', {
                        docs: docs,
                        ajax: true
                    });
                } else {
                    res.render(self.viewPath + 'nomore.jade');
                }
            });
        };

        base.getList = function (page, next) {
            var self = this;
            this.Collection.find().sort('-createdAt').skip(page * 6).limit(6).exec(function (err, docs) {
                self.getMain(function (err, main) {
                    if (main) {
                        docs = docs.filter(function (item) {
                            return item.id !== main.id;
                        });
                    }
                    next(err, docs, main);
                });
            });
        };

        base.getMain = function (next) {
            this.Collection.find({
                isMain: 'on'
            }).sort('-createdAt').exec(function (err, main) {
                next(err, main[0]);
            });
        };

        return base;
    };

    exports.NewsController = NewsController;
}(exports, require));