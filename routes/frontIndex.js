var localization = require('../modules/localization').localization;

module.exports = function (app) {
    'use strict';

    function showIndex(req, res) {
        var cashObj = {},
            dateNow = new Date(),
            newDate,
            doc = {};

        cashObj = req.app.superCash[req.originalUrl];

        if (cashObj && cashObj.updatedAt > dateNow) {
            res.status(200).send(cashObj.html);
        } else {
            // res.locals.MainMenu = app.menuController.getMainMenu();

            /* res.locals.path = '/index.html';
             if (res.locals.lang) {
                 res.locals.path = '/' + res.locals.lang + '/index.html';
             }*/

            app.newsController.getList(0, function (err, ndocs, main) {
                app.mediaController.getList(0, function (err, mdocs) {
                    app.congratulationsController.getList(0, function (err, cdocs) {
                        newDate = new Date();
                        newDate.setTime(dateNow.getTime() + (1200000));
                        doc = {
                            metatags: {
                                index: 'true',
                                keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Лицей, официальный сайт Лицея БГУ',
                                description: 'Официальный сайт Лицея БГУ'
                            },
                            ndocs: ndocs,
                            cdocs: cdocs,
                            mdocs: mdocs,
                            main: main,
                            updatedAt: newDate
                        }
                        req.app.sendPage(req, res, doc, 'index.jade', true);
                    });
                });
            });
        }
    }

    app.get('/', localization, function (req, res) {
        showIndex(req, res);
    });
    app.get('/:lang', localization, function (req, res) {
        showIndex(req, res);
    });
    app.get('/index.html', localization, function (req, res) {
        showIndex(req, res);
    });
    app.get('/:lang/index.html', localization, function (req, res) {
        showIndex(req, res);
    });

    app.get('/404.html', localization, function (req, res) {
        res.status(404).render('404.jade');
    });

};