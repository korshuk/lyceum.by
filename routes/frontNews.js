var localization = require('../modules/localization').localization;

module.exports = function (app) {
    'use strict';
    var metatags = function (res) {
        res.locals.metatags = {
            title: 'Новости',
            keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Новости',
            description: 'Новости Лицея БГУ'
        };
    };

    app.get('/news.html', localization, function (req, res) {
        res.locals.MainMenu = app.menuController.getMainMenu();
        res.locals.path = '/news.html';
        metatags(res);
        app.newsController.showList(req, res);
    });
    app.get('/:lang/news.html', localization, function (req, res) {
        res.locals.MainMenu = app.menuController.getMainMenu();
        res.locals.path = '/' + req.params.lang + '/news.html';
        metatags(res);
        app.newsController.showList(req, res);
    });

    app.get('/morenews/:page', localization, function (req, res) {
        app.newsController.moreList(req, res);
    });
    app.get('/:lang/morenews/:page', localization, function (req, res) {
        app.newsController.moreList(req, res);
    });

    app.get('/news/:w.html', localization, function (req, res) {
        req.params.newsType = 'news';
        req.params.path = '/news/' + req.params.w + '.html';
        req.appContentType = 'news';
        app.newsController.show(req, res);
    });
    app.get('/:lang/news/:w.html', localization, function (req, res) {
        req.params.newsType = 'news';
        req.params.path = '/' + req.params.lang + '/news/' + req.params.w + '.html';
        req.appContentType = 'news';
        app.newsController.show(req, res);
    });
};