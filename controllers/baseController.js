/*jslint plusplus: true */
(function (exports, require) {
    'use strict';

    var BaseController;

    BaseController = function (name, path, mongoose, application, adminInPath) {
        var self = this;
        var adminPath = adminInPath ? '' : 'admin/';
        this.app = application;
        this.name = name;
        this.viewPath = this.name.toLowerCase() + '/';
        this.path = adminPath + path.toLowerCase();
        console.log('this.path', this.path)
        this.model = require('../models/' + this.name.toLowerCase());
        this.model.define(mongoose, function () {
            self.Collection = mongoose.model(self.name);
        });
    };

    BaseController.prototype.setId = require('./menu').menuReqHelper;

    BaseController.prototype.show = function (req, res) {
        var self = this,
            cashObj;
        this.setId(req, res);
        this.Collection.findByReq(req, res, function (doc) {
            cashObj = req.app.superCash[req.originalUrl];
            if (cashObj && (cashObj.updatedAt >= doc.updatedAt)) {
                req.app.superCash[req.originalUrl].counter =  req.app.superCash[req.originalUrl].counter + 1;
                res.status(200).send(cashObj.html);
            } else {
                req.app.sendPage(req, res, doc, self.viewPath + 'show.jade');
            }
        });
    };

    BaseController.prototype.list = function (req, res) {
        var self = this;
        this.Collection.find().sort('-createdAt').exec(function (err, docs) {
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

    BaseController.prototype.create = function (req, res) {
        var self = this,
            doc;
        if (req.session && req.session.locals && req.session.locals.doc) {
            doc = req.session.locals.doc;
            req.session.locals = {};
        } else {
            doc = new self.Collection();
        }
        var queryId = ""
        if (req.query && req.query.id) {
            queryId = req.query.id
        }
        res.render(self.viewPath + 'new.jade', {
            doc: doc,
            queryId:queryId,
            method: 'post'
        });
    };

    BaseController.prototype.edit = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            res.render(self.viewPath + 'new.jade', {
                doc: doc,
                method: 'put'
            });
        });
    };

    BaseController.prototype.checkWidth = function (doc) {
        var caption_re = /\[(.*)\]/,
            lines,
            lastlineFirstCol,
            langs = ['ru', 'by', 'en'],
            block,
            i;
        langs.forEach(function (lang) {
            for (i = 0; i < doc.bodynew.ru.blocks.length; i++) {
                block = doc.bodynew[lang].blocks[i];
                if (block != undefined && block.type === 'table') {
                    lines = block.data.content;
                    lastlineFirstCol = lines[lines.length - 1][0];
                    if (lastlineFirstCol.match(caption_re)) {
                        if (lastlineFirstCol.match(caption_re)[1] === 'table' || lastlineFirstCol.match(caption_re)[1] === 'olymp') {
                            doc.type[lang] = lastlineFirstCol.match(caption_re)[1];
                        }
                    }
                }
            }
        });
        return doc;
    };

    BaseController.prototype.sirToJson = function (req, name) {
        if (req.body[name + '.ru']) {
            req.body[name + '.ru.data'] = JSON.parse(req.body[name + '.ru']).data;
        }
        if (req.body[name + '.by']) {
            req.body[name + '.by.data'] = JSON.parse(req.body[name + '.by']).data;
        }
        if (req.body[name + '.en']) {
            req.body[name + '.en.data'] = JSON.parse(req.body[name + '.en']).data;
        }
        if (req.body[name + 'new.ru']) {
            req.body[name + 'new.ru.blocks'] = JSON.parse(req.body[name + 'new.ru']).blocks;
        }
        if (req.body[name + 'new.by']) {
            req.body[name + 'new.by.blocks'] = JSON.parse(req.body[name + 'new.by']).blocks;
        }
        if (req.body[name + 'new.en']) {
            req.body[name + 'new.en.blocks'] = JSON.parse(req.body[name + 'new.en']).blocks;
        }
        if (req.body['messageTemplate']) {
            req.body['messageTemplate.blocks'] = JSON.parse(req.body['messageTemplate']).blocks;
        }
    };

    BaseController.prototype.sirToJsonDoc = function (doc, req, name) {
        if (req.body[name + '.ru']) {
            doc[name].ru.data = JSON.parse(req.body[name + '.ru']).data;
        }
        if (req.body[name + '.by']) {
            doc[name].by.data = JSON.parse(req.body[name + '.by']).data;
        }
        if (req.body[name + '.en']) {
            doc[name].en.data = JSON.parse(req.body[name + '.en']).data;
        }
        if (req.body[name + 'new.ru']) {
            doc[name + 'new'].ru.blocks = JSON.parse(req.body[name + 'new.ru']).blocks;
        }
        if (req.body[name + 'new.by']) {
            doc[name + 'new'].by.blocks = JSON.parse(req.body[name + 'new.by']).blocks;
        }
        if (req.body[name + 'new.en']) {
            doc[name + 'new'].en.blocks = JSON.parse(req.body[name + 'new.en']).blocks;
        }
        if (req.body['messageTemplate']) {
            doc['messageTemplate'].blocks = JSON.parse(req.body['messageTemplate']).blocks;
        }

        return doc;
    };

    exports.BaseController = BaseController;
}(exports, require));