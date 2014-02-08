var  localization = require('../modules/localization').localization;

module.exports = function(app) {

  var metatags = function(res) {
    res.locals.metatags = {
      title: 'Контакты',
      keywords: 'Контакты',
      description: 'Контакты'
    };
  };

  app.get('/contacts.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/contacts.html';
    metatags(res);
    app.contactsController.showList(req, res);
  });
  app.get('/:lang/contacts.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/' + res.locals.lang + '/contacts.html';
    metatags(res);
    app.contactsController.showList(req, res);
  });

}