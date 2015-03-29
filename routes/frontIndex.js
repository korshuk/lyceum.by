module.exports = function (app) {
    'use strict';

    function showIndex(req, res) {
        var cashObj = {},
            dateNow = new Date(),
            newDate,
            doc = {};

        cashObj = req.app.superCash[req.originalUrl];

        if (cashObj && cashObj.updatedAt > dateNow) {
            req.app.superCash[req.originalUrl].counter = req.app.superCash[req.originalUrl].counter + 1;
            res.status(200).send(cashObj.html);
        } else {
            req.appContentType = 'index';
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
                        req.app.sendPage(req, res, doc, 'index.jade');
                    });
                });
            });
        }
    }

    app.get('/', function (req, res) {
        console.log('get /');
        showIndex(req, res);
    });
    app.get('/:lang', function (req, res) {
        console.log('get /:lang')
        showIndex(req, res);
    });
    app.get('/index.html', function (req, res) {
        showIndex(req, res);
    });
    app.get('/:lang/index.html', function (req, res) {
        showIndex(req, res);
    });
};