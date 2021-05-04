module.exports = function (app) {
    'use strict';
    console.log('statsRoutes')
    app.get('/calculate', function (req, res) {
        app.sotkaController.calculate(function(doc) {
            res.json(doc)
        });
    });
    app.get('/frontstats', function (req, res) {
        app.sotkaController.restStats(req, res);
    });
}