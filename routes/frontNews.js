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

    app.get('/news.html', localization, showNews);
    app.get('/:lang/news.html', localization, showNews);

    app.get('/morenews/:page', localization, moreList);
    app.get('/:lang/morenews/:page', localization, moreList);

    app.get('/morenewsitems/:page', localization, moreNewsItems);
    app.get('/:lang/morenewsitems/:page', localization, moreNewsItems);

    app.get('/news/:w.html', localization, showNewsItem);
    app.get('/:lang/news/:w.html', localization, showNewsItem);

    function moreList (req, res) {
        app.newsController.moreList(req, res);
    }

    function moreNewsItems(req, res) {
        const page = req.params.page;

        app.newsController.getList(page, function (err, ndocs, main) {
            app.congratulationsController.getList(page, function (err, cdocs) {
                var docs = ndocs
                    .map(setNewsFlag)
                    .concat(cdocs)
                    .sort(sortByDate);
                var templateName = 'news/';

                templateName += docs.length > 0 ? 'indexlist.jade' : 'nomore.jade';

                res.render(templateName, {
                    docs: docs,
                    ajax: true
                });

            });
        });

        function sortByDate(a, b) {
            return b.createdAt - a.createdAt;
        }

        function setNewsFlag(doc) {
            doc.isNews = true;
            return doc;
        }
    }

    function showNews(req, res) {
        res.locals.MainMenu = app.menuController.getMainMenu();
        res.locals.path = '/news.html';
        res.locals.siteConfig = app.siteConfig;
        metatags(res);
        app.newsController.showList(req, res);
    }

    function showNewsItem(req, res) {
        req.params.newsType = 'news';
        req.params.path = '/news/' + req.params.w + '.html';
        req.appContentType = 'news';
        app.newsController.show(req, res);
    }
};