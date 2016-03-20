var  localization = require('../modules/localization').localization;

module.exports = function(app) {

  var metatags = function(res) {
    res.locals.metatags = {
      title: 'Результаты экзамена',
      keywords: 'Лицей БГУ, Лицей Белорусского государственного университета',
      description: 'Результаты вступительных экзаменов'
    };
  };

  app.get('/stats.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/stats.html';
    metatags(res);
    res.render('stats.jade');
  });
}