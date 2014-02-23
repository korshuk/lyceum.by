var  localization = require('../modules/localization').localization;

module.exports = function(app) {

  var metatags = function(res) {
     res.locals.metatags = {
      title: 'Поздравления',
      keywords: 'Поздравления',
      description: 'Поздравления'
    };
  };

  app.get('/congratulations.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/congratulations.html';
    metatags(res);
    app.congratulationsController.showList(req, res);
  });
  app.get('/:lang/congratulations.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/' + req.params.lang + '/congratulations.html';
    metatags(res);
    app.congratulationsController.showList(req, res);
  });

	app.get('/congratulations/:w.html', localization, function(req, res) {
      res.locals.MainMenu = app.menuController.getMainMenu();
      res.locals.congratulationsType = 'congratulations';
      req.params.congratulationsType = 'congratulations';
      req.params.path ='/congratulations/' + req.params.w + '.html';
      metatags(res);
      app.congratulationsController.show(req, res);
  });
  app.get('/:lang/congratulations/:w.html', localization, function(req, res) {
      res.locals.MainMenu = app.menuController.getMainMenu();
      res.locals.congratulationsType = 'congratulations';
      req.params.congratulationsType = 'congratulations';
      req.params.path = '/' + req.params.lang + '/congratulations/' + req.params.w + '.html';
      metatags(res);
      app.congratulationsController.show(req, res);
  });
  app.get('/morecongratulations/:page', localization, function(req, res) {
    app.congratulationsController.moreList(req, res);
  });
  app.get('/:lang/morecongratulations/:page', localization, function(req, res) {
    app.congratulationsController.moreList(req, res);
  });
}