var BaseController = require('./baseController').BaseController;

var PupilMessageController = function(mongoose, app) {

    var base = new BaseController('PupilMessage', '', mongoose, app, true);
    base.path = '/admin/pupils/pupilMessages';

    base.save = function(req, res) {
        var self = this;
        self.sirToJson(req, 'messageTemplate');

        var doc = new this.Collection(req.body);
        
        doc.save(function(err) {
            if (err) {
                req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                req.session.locals = {doc: doc};
                res.redirect(self.path + '/create');
            }
            else {
                req.session.success = 'Сообщение <strong>' + doc.name + '</strong> создано ' + doc.createdAt;
                res.redirect(self.path);
            }
        });
    };

    base.update = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){
            doc.name = req.body.name;
            doc.type = req.body.type;
            doc.order = req.body.order;
            doc = self.sirToJsonDoc(doc, req, 'messageTemplate');
            doc.save(function(err) {
                if (err) {
                    req.session.error = 'Не получилось обновить сообщение(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {doc: doc};
                    res.redirect(self.path + '/' + doc.id + '/edit');
                }
                else {
                    req.session.success = 'Сообщение <strong>' + doc.name + '</strong> обновлено';
                    res.redirect(self.path);
                }
            });
        });
    };

    base.list = function (req, res) {
        var self = this;
        this.Collection.find().sort('order').exec(function (err, docs) {
                var docksCount = docs.length;
                var pageNum = req.query.page || 0;
                var pagesCount = Math.ceil(docksCount / 20);
                var docsToRender = [];
                for (var i = pageNum * 20; i < pageNum * 20 + 20; i++) {
                    if (docs[i] && docs[i]. _id) {
                        docsToRender.push(docs[i])
                    }
                    
                }
                res.render(self.viewPath + 'list.jade', {
                    docs: docsToRender,
                    pageNum: pageNum,
                    pagesCount: pagesCount,
                    docksCount: docksCount,
                    viewName: self.name.toLowerCase(),
                    siteConfig: self.app ? self.app.siteConfig : {}
                });
        });
    };

    base.remove = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){
            var name = doc.name;
            doc.remove(function() {
                req.session.success = 'Сообщение <strong>' + name + '</strong> успешно удалёно';
                res.redirect(self.path);
            });
        });
    };

    base.constructor = arguments.callee;

    return base;
};



exports.PupilMessageController = PupilMessageController;