var  localization = require('../modules/localization').localization;

module.exports = function(app) {

  var metatags = function(res) {
    res.locals.metatags = {
      title: 'Контакты',
      keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Контакты, Адрес, Телефон',
      description: 'Контактная информация'
    };
  };

  app.get('/contacts.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/contacts.html';
    res.locals.siteConfig = app.siteConfig;
    metatags(res);
    app.contactsController.showList(req, res);
  });
  app.get('/:lang/contacts.html', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/' + res.locals.lang + '/contacts.html';
    res.locals.siteConfig = app.siteConfig;
    metatags(res);
    app.contactsController.showList(req, res);
  });

  app.get('/contact/enroll/:id', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/contact/enroll/' + req.param.id;
    res.locals.siteConfig = app.siteConfig;
    metatags(res);
    app.contactsController.getAppointmentForm(req, res);
  });

  app.post('/contact/enroll/:id', localization, function(req, res) {
    res.locals.MainMenu = app.menuController.getMainMenu();
    res.locals.path = '/contact/enroll/' + req.param.id;
    res.locals.siteConfig = app.siteConfig;
    metatags(res);
    app.contactsController.postAppointmentForm(req, res);
  });
}