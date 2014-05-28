var  localization = require('../modules/localization').localization;

module.exports = function(app) {

  function showIndex(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/index.html';
    if (res.locals.lang) {
      res.locals.path = '/' + res.locals.lang + '/index.html';
    }
    app.newsController.getList(0, function(err, ndocs, main) {
        app.mediaController.getList(0, function(err, mdocs) {
             app.congratulationsController.getList(0, function(err, cdocs) {
                res.locals.metatags = {
                  index: 'true',
                  keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Лицей, официальный сайт Лицея БГУ',
                  description: 'Официальный сайт Лицея БГУ',
                };
                res.render('index.jade', {ndocs: ndocs, cdocs: cdocs, mdocs: mdocs, main: main});
             });
        });
    });
   };
  
  app.get('/', localization, function(req, res) {
    showIndex(req, res);
  });
  app.get('/index.html', localization, function(req, res) {
      showIndex(req, res);
  });
  app.get('/:lang/index.html', localization, function(req, res) {
    showIndex(req, res);
  });
  
  app.get('/404.html', localization, function(req, res){
   res.status(404).render('404.jade');
  });
	
}