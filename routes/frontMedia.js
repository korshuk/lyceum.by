var  localization = require('../modules/localization').localization;

module.exports = function(app) {
  var metatags = function(res) {
     res.locals.metatags = {
      title: 'Лицей в СМИ',
      keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Новости',
      description: 'Сообщения в СМИ о Лицее'
    };
  };

  app.get('/media.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/media.html';
    res.locals.siteConfig = app.siteConfig;
    metatags(res);
    app.mediaController.showList(req, res);
  });
  app.get('/:lang/media.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/' + res.locals.lang + '/media.html';
    res.locals.siteConfig = app.siteConfig;
    metatags(res);
    app.mediaController.showList(req, res);
  });
  app.get('/moremedia/:page', localization, function(req, res) {
    app.mediaController.moreList(req, res);
  });
  app.get('/:lang/moremedia/:page', localization, function(req, res) {
    app.mediaController.moreList(req, res);
  });
}