BaseController = function(name, path, mongoose, application) {
	var self = this;

  this.name = name;
  this.viewPath = this.name.toLowerCase() + '/';
  this.path = 'admin/'+ path.toLowerCase();
  this.model = require('../models/'+ this.name.toLowerCase());
	this.model.define(mongoose, function() {
	  self.Collection = mongoose.model(self.name);
	});
};

BaseController.prototype.show = function(req, res, next) {
  var self = this;
  this.Collection.findByReq(req, res, function(doc){
    res.render(self.viewPath + 'show.jade', {doc: doc, path: req.path});
  });
};

BaseController.prototype.list = function(req, res) {
  var self = this;
  this.Collection.find().sort('-createdAt').exec(function(err, docs) {
    res.render(self.viewPath + 'list.jade', {docs: docs});
  //  console.log(docs);
  });
};

BaseController.prototype.create = function(req, res) {
    var self = this;
    var doc;
    if (req.session && req.session.locals && req.session.locals.doc) {
      doc = req.session.locals.doc;
      req.session.locals = {};
    }
    else {
      doc = new self.Collection();;
    }
  	res.render(self.viewPath + 'new.jade', {doc: doc, method: 'post'});
};

BaseController.prototype.edit = function(req, res) {
  var self = this;
  this.Collection.findByReq(req, res, function(doc){
      res.render(self.viewPath + 'new.jade', {doc: doc, method: 'put'});
  });
};

BaseController.prototype.checkWidth = function(doc) {
    var caption_re = /\[(.*)\]/;
    var lines;
    var lastline;
    var langs = ['ru', 'by', 'en']; 
    var block; 
    langs.forEach(function(lang){
      for (var i = 0; i < doc.body.ru.data.length; i++) {
        block = doc.body[lang].data[i];
        if (block != undefined && block.type === 'table') {
          lines = block.data.text.split("\n");
          lastline = lines[lines.length-1];
          if (lastline.match(caption_re)) {
            if (lastline.match(caption_re)[1] === 'table' || lastline.match(caption_re)[1] === 'olymp') {
              doc.type[lang] = lastline.match(caption_re)[1];
            }
          }
        }
      };
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

    return doc;
};

exports.BaseController = BaseController;