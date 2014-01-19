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
    res.render(self.viewPath + 'show.jade', {doc: doc});
  });
};

BaseController.prototype.list = function(req, res) {
  var self = this;
  this.Collection.find().sort('-createdAt').exec(function(err, docs) {
    res.render(self.viewPath + 'list.jade', {docs: docs});
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
          console.log('!!!!!!!!!!!!!!!!!!!!');
        console.log(doc);
  	res.render(self.viewPath + 'new.jade', {doc: doc});
};

exports.BaseController = BaseController;