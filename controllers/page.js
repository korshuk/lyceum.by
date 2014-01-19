var BaseController = require('./baseController').BaseController,
    MenuController = require('../controllers/menu').MenuController,
    translit = require('../modules/translit').translit;

PageController = function(mongoose, application) {
 
  var base  = new BaseController('Page', 'pages', mongoose, application);

  base.menu = new MenuController(base, application);
  base.menu.generate(base.Collection);

  base.edit = function(req, res) {
      var self = this;
      this.Collection.findByReq(req, res, function(doc){
        res.render(self.viewPath + 'new.jade', {doc: doc, parents: self.menu.List});
      });
  };

  base.remove = function(req, res) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      var name = doc.name;
      doc.remove(function() {
        self.menu.generate(self.Collection);
        req.session.success = 'Страница <strong>' + name + '</strong> успешно удалёна';
        res.redirect(self.path);
      });
    });
  };

  base.update = function(req, res) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      doc.name = req.body.name;
      doc.body = req.body.body;
      doc.parentpage = req.body.parentpage;
      doc.pathAlias = req.body.pathAlias;
      doc.order = req.body.order || 0;
      doc.updatedAt = new Date();
      doc.save(function(err) {
        if (err) console.log(err);
        //TODO error handling
        self.menu.generate(self.Collection);
        req.session.success = 'Страница <strong>' + doc.name + '</strong> обновлена';
        res.redirect(self.path);
      });
    });
  };

  base.save = function(req, res) {
    var self = this;
    var doc = new this.Collection(req.body);
    if (doc.name['ru']) {
      doc.pathAlias = translit(doc.name['ru']);
    }
    doc.save(function(err) {
      if (err) {
        req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
        req.session.locals = {doc: doc};
        console.log('!!!!!!!!!!!!!!!!!!!!');
        console.log(doc);

        res.redirect(self.path + '/create');
       // res.render(self.viewPath + 'new.jade', {doc: doc});
      } 
      else {
        self.menu.generate(self.Collection);
        req.session.success = 'Страница <strong>' + doc.name.ru + '</strong> создана ' + doc.createdAt;
        res.redirect(self.path);
      }
    });
  };

  base.parentsHelper = function(req, res, next) {
    res.locals.parents = base.menu.List;
    next();
  };

  base.constructor = arguments.callee;

  return base;
};

exports.PageController = PageController;