/*jslint node: true */
(function (exports, require) {
    'use strict';
    var localization = require('../modules/localization').localization;
    module.exports = function (app) {
        app.get('/404.html', localization, function (req, res) {
            console.log('frontroutes 4');
            res.render('404.jade');
        });

        app.get('/:lang/404.html', localization, function (req, res) {
            res.render('404.jade');
        });

        require('../routes/frontIndex')(app);
        require('../routes/frontNews')(app);
        require('../routes/frontMedia')(app);
        require('../routes/frontCongratulations')(app);
        require('../routes/frontContacts')(app);
        require('../routes/frontResults')(app);
        require('../routes/frontPupils')(app);
        require('../routes/frontStats')(app);
    };
}(exports, require));