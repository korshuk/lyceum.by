/*jslint node: true */
(function (exports, require) {
    'use strict';
    exports.configure = function (app) {
        function extend(dest, from) {
            var props = Object.getOwnPropertyNames(from);
            props.forEach(function (name) {
                dest[name] = from[name];
            });
            return dest;
        }

        app.superCash = {};

        app.helpers = {
            setMenu: require('../controllers/menu').menuHelper,
            setLang: require('../modules/localization').loclizationHelper
        };

        app.sendPage = function (req, res, doc, viewPath) {
            var self = this,
                renderData = {},
                newDate;

            renderData = extend(renderData, self.helpers.setLang(req, res));
            renderData = extend(renderData, self.helpers.setMenu(req, res));
            renderData.siteConfig = self.siteConfig;
            if (req.appContentType === 'index') {
                renderData = extend(renderData, doc);
            } else {
                renderData.doc = doc;
            }
            renderData.path = req.path;
            res.render(viewPath,
                renderData,
                function (err, html) {
                    newDate = new Date();
                    self.superCash[req.originalUrl] = {
                        html: html,
                        updatedAt: doc.updatedAt,
                        addedToCash: newDate,
                        counter: 1
                    };
                    res.status(200).send(html);
                });
        };

        return app;
    };

}(exports, require));