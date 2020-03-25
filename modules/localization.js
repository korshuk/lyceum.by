(function (exports, require) {
    'use strict';
    var Localize = require('localize'),
        localize = new Localize('./translations', "dd.mm.yyyy", "ru");

    function setLocale(req, res, next) {
        console.log(req.originalUrl);
        var lang = req.params.lang;
        if (lang !== "ru" && lang !== "by" && lang !== "en" && lang !== undefined) {
            console.log('laocalization.js 9');
            res.redirect('404.html');
        } else {
            if (lang === undefined) {
                lang = "ru";
            } else {
                res.locals.lang = lang;
            }
            localize.setLocale(lang);

            res.locals.translate = localize.translate;
            res.locals.translateObj = function (obj) {
                return obj[res.locals.lang || "ru"] || obj.ru;
            };
            res.locals.translateNews = function (obj) {
                if (obj[res.locals.lang || "ru"].blocks.length > 0) {
                    return obj[res.locals.lang || "ru"];
                } else {
                    return obj.ru;
                }
            };
            res.locals.localDate = localize.localDate;
            next();
        }

    }

    function setLang(req, res) {
        var lang = req.params.lang,
            renderData = {};
        console.log(req.params);
        if (lang !== "ru" && lang !== "by" && lang !== "en" && lang != undefined) {
            console.log('localization.js 40');
            res.redirect('404.html');
        } else {
            if (lang == undefined) {
                lang = "ru";
            } else {
                renderData.lang = lang;
            }
            localize.setLocale(lang);
            renderData.translate = localize.translate;
            renderData.localDate = localize.localDate;

            renderData.translateObj = function (obj) {
                return obj[renderData.lang || "ru"] || obj.ru;
            };
            renderData.translateNews = function (obj) {
                if (obj[renderData.lang || "ru"].blocks.length > 0) {
                    return obj[renderData.lang || "ru"];
                } else {
                    return obj.ru;
                }
            };

            console.log(renderData);
            return renderData;
        }
    }

    exports.loclizationHelper = setLang;

    exports.localization = setLocale;
}(exports, require));