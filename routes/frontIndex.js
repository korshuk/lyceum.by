module.exports = function (app) {
    'use strict';

    app.get('/', showIndex);
    app.get('/:lang', showIndex);
    app.get('/index.html', showIndex);
    app.get('/:lang/index.html', showIndex);

    function showIndex(req, res) {
        var cashObj = req.app.superCash[req.originalUrl],
            dateNow = new Date(),
            newDate,
            doc = {};

        if (cashObj && cashObj.updatedAt > dateNow) {
            req.app.superCash[req.originalUrl].counter = req.app.superCash[req.originalUrl].counter + 1;
            res.status(200).send(cashObj.html);
        } else {
            req.appContentType = 'index';

            app.newsController.getList(0, function (err, ndocs, main) {
                app.mediaController.getList(0, function (err, mdocs) {
                    app.congratulationsController.getList(0, function (err, cdocs) {
                        var docs = ndocs
                            .concat(cdocs)
                            .sort(sortByDate)
                            .slice(0, 9);

                        newDate = new Date();
                        newDate.setTime(dateNow.getTime() + (1200000));

                        doc = {
                            metatags: {
                                index: 'true',
                                keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Лицей, официальный сайт Лицея БГУ',
                                description: 'Официальный сайт Лицея БГУ'
                            },
                            ndocs: docs,
                            cdocs: cdocs,
                            mdocs: mdocs,
                          //  docs: docs,
                            main: main,
                            updatedAt: newDate
                        };

                        req.app.sendPage(req, res, doc, 'index.jade');


                    });
                });
            });
        }

        function sortByDate(a, b) {
            return b.createdAt - a.createdAt;
        }
    }
};

