var BaseController = require('./baseController').BaseController;

NewsController = function(mongoose) {

  var base  = new BaseController('News', 'news', mongoose);

  base.edit = function(req, res, next) {
    this.Collection.findByReq(req, res, function(news) {
        res.render('news/edit.jade', {n: news});
    });
  };

  base.update = function(req, res, next) {
    this.Collection.findOne({ _id: req.params.id}, function(err, news) {
        if (!news) return next(new NotFound('Document not found'));
        news.title = req.body.title;
        news.body = req.body.body;
        news.save(function(err) {
          //   req.flash('info', 'Document updated');
          res.redirect('/news');
        });
      });
  };

  base.save = function(req, res) {
    var n = new this.Collection(req.body);
    n.save(function() {
      req.session.success = 'Новость от <strong>' + n.createdAt + '</strong> создана';
      res.redirect('/news');
    });
  };

  base.constructor = arguments.callee;

  return base;
};



exports.NewsController = NewsController;
