var  localization = require('../modules/localization').localization;

module.exports = function(app) {

  var metatags = function(res) {
    res.locals.metatags = {
      title: 'Результаты экзамена',
      keywords: 'Лицей БГУ, Лицей Белорусского государственного университета',
      description: 'Результаты вступительных экзаменов'
    };
  };

  app.get('/results.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/contacts.html';
    metatags(res);
    app.resultsController.show(req, res);
  });
  app.get('/:lang/results.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/' + res.locals.lang + '/contacts.html';
    metatags(res);
    app.resultsController.show(req, res);
  });

  app.post('/results/getResult', function(req, res) {
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');
    app.examsController.getResult(req, res);
  });
  
  app.post('/results/getResultTest', function(req, res) {
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');
    app.examsController.getResultTest(req, res);
  });


};