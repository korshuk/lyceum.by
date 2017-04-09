var localization = require('../modules/localization').localization;

module.exports = function (app) {

    var metatags = function (res) {
        res.locals.metatags = {
            title: 'Поздравления',
            keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Новости',
            description: 'Успехи и победы лицеистов'
        };
    };

    app.get('/congratulations.html', localization, function (req, res) {
        res.locals.MainMenu = app.menuController.getMainMenu();
        res.locals.path = '/congratulations.html';
        res.locals.siteConfig = app.siteConfig;
        metatags(res);
        app.congratulationsController.showList(req, res);
    });
    app.get('/:lang/congratulations.html', localization, function (req, res) {
        res.locals.MainMenu = app.menuController.getMainMenu();
        res.locals.path = '/' + req.params.lang + '/congratulations.html';
        res.locals.siteConfig = app.siteConfig;
        metatags(res);
        app.congratulationsController.showList(req, res);
    });

    app.get('/congratulations/:w.html', localization, function (req, res) {
        req.params.congratulationsType = 'congratulations';
        req.params.path = '/congratulations/' + req.params.w + '.html';
        res.locals.siteConfig = app.siteConfig;
        req.appContentType = 'congratulations';
        app.congratulationsController.show(req, res);
    });
    app.get('/:lang/congratulations/:w.html', localization, function (req, res) {
        req.params.congratulationsType = 'congratulations';
        req.params.path = '/' + req.params.lang + '/congratulations/' + req.params.w + '.html';
        req.appContentType = 'congratulations';
        app.congratulationsController.show(req, res);
    });
    app.get('/morecongratulations/:page', localization, function (req, res) {
        app.congratulationsController.moreList(req, res);
    });
    app.get('/:lang/morecongratulations/:page', localization, function (req, res) {
        app.congratulationsController.moreList(req, res);
    });
}