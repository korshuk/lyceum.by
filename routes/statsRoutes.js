module.exports = function (app) {
    'use strict';
    console.log('statsRoutes')
    app.get('/calculate', function (req, res) {
        app.sotkaController.calculate(function(doc) {
            res.json(doc)
        });
    });
    
    app.get('/calculateSubjects', function (req, res) {
        app.sotkaController.calculateSubjects(function(doc) {
            res.json(doc)
        });
    });

    app.get('/getSubjectStats/:subjectId', function (req, res) {
        var subjectId = req.params.subjectId;
        app.sotkaController.getSubjectStats(subjectId, function(doc) {
            res.json(doc)
        });
    });
    
    app.get('/getAllSubjectStats', function (req, res) {
        app.sotkaController.getAllSubjectStats(function(doc) {
            res.json(doc)
        });
    });

    app.get('/getAllProfileStats', function (req, res) {
        app.sotkaController.getAllProfileStats(function(doc) {
            res.json(doc)
        });
    });

    

    app.get('/frontstats', function (req, res) {
        app.sotkaController.restStats(req, res);
    });
}