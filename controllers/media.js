var BaseController = require('./baseController').BaseController;

require('../modules/date.js');

MediaController = function(mongoose) {

  var base  = new BaseController('Media', 'media', mongoose);

  base.remove = function(req, res) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      doc.remove(function() {
        req.session.success = 'Новость успешно удалена';
        res.redirect(self.path);
      });
    });
  };

  base.update = function(req, res, next) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      doc.name.ru = req.body['name.ru'];
      doc.image = req.body['image'];
      doc.name.by = req.body['name.by'];
      doc.name.en = req.body['name.en'];
      doc.body.ru = req.body['body.ru'];
      doc.body.by = req.body['body.by'];
      doc.body.en = req.body['body.en'];
      doc.link = req.body['link'];
      doc.updatedAt = new Date();
      doc.createdAt = req.body['createdAt'];
      doc.save(function(err) {
        if (err) {
          req.session.error = 'Не получилось обновить новость(( Возникли следующие ошибки: <p>' + err + '</p>';
          req.session.locals = {doc: doc};
          res.redirect(self.path + '/' + doc.id + '/edit');
        }
        else {
          req.session.success = 'Новость <strong>' + doc.body.ru + '</strong> обновлена';
          res.redirect(self.path);
        }
      });
    });
  };

  base.save = function(req, res) {
    var self = this;
    var doc = new this.Collection(req.body);
    var date = new Date();
    doc.save(function(err) {
      if (err) {
        req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
        req.session.locals = {doc: doc};
        res.redirect(self.path + '/create');
      } 
      else {
        req.session.success = 'Новость от <strong>' + doc.createdAt.format('dd-MM-yyyy hh:mm:ss') + '</strong> создана';
        res.redirect(self.path);
      }
    });
  };

  base.showList = function(req, res) {
      var self = this;
      this.getList(0, function(err, docs) {
        res.render(self.viewPath + 'frontlist.jade', {docs: docs});
      });
  };
  base.moreList = function(req, res) {
    var self = this;
    this.getList(req.params.page, function(err, docs) {
      if (docs.length > 0)
        res.render(self.viewPath + 'indexlist.jade', {docs: docs, ajax: true});
      else
        res.render(self.viewPath + 'nomore.jade');
    });
  };
  base.getList = function(page, next) {
    this.Collection.find().sort('-createdAt').skip(page*6).limit(6).exec(function(err, docs) {
      next(err, docs);
    });
  };


  base.constructor = arguments.callee;

  return base;
};



exports.MediaController = MediaController;
