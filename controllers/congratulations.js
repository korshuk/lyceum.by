var BaseController = require('./baseController').BaseController;

require('../modules/date.js');

CongratulationsController = function(mongoose) {

  var base  = new BaseController('Congratulations', 'congratulations', mongoose);

  base.remove = function(req, res) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      doc.remove(function() {
        req.session.success = 'Новость успешно удалена';
        res.redirect(self.path);
      });
    });
  };

  base.update = function(req, res) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      doc.name.ru = req.body['name.ru'];
      doc.name.by = req.body['name.by'];
      doc.name.en = req.body['name.en'];
      doc.image = req.body['image'];
      doc = self.sirToJsonDoc(doc, req, 'body');
      doc = self.sirToJsonDoc(doc, req, 'teaser');
      doc = self.checkWidth(doc);
      doc.createdAt = req.body['createdAt'];
      doc.pathAlias = doc.createdAt.format('ddMMyyyyhhmmss');
      doc.updatedAt = new Date();
      doc.save(function(err) {
        if (err) {
          req.session.error = 'Не получилось обновить поздравление(( Возникли следующие ошибки: <p>' + err + '</p>';
          req.session.locals = {doc: doc};
          res.redirect(self.path + '/' + doc.id + '/edit');
        }
        else {
          req.session.success = 'Поздравление <strong>' + doc.createdAt.format('dd-MM-yyyy hh:mm:ss') + '</strong> обновлена';
          res.redirect(self.path);
        }
      });
    });
  };

  base.save = function(req, res) {
    var self = this;
    self.sirToJson(req, 'body');
    self.sirToJson(req, 'teaser');
    var doc = new this.Collection(req.body);
    var date = new Date();
    doc.pathAlias = date.format('ddMMyyyyhhmmss');
    doc = self.checkWidth(doc);
    console.log(doc.pathAlias);
    doc.save(function(err) {
      if (err) {
        req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
        req.session.locals = {doc: doc};
        res.redirect(self.path + '/create');
      } 
      else {
        req.session.success = 'Поздравление <strong>' + doc.name.ru + '</strong> создана';
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



exports.CongratulationsController = CongratulationsController;
