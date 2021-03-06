var express = require('express'),
    moment = require('moment');

module.exports = function(app) {

    var router = express();
    router.locals.moment = moment;

    router.get('/', app.userController.Pass, function(req, res) {
            app.subjectController.list(req, res);
        });

    router.get('/create', app.userController.Pass, function(req, res) {
        app.subjectController.create(req, res);
    });

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.subjectController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        app.subjectController.edit(req, res);
    });

    router.post('/', app.userController.Pass, function(req, res) {
        app.subjectController.save(req, res);
    });

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.subjectController.update(req, res);
    });

    router.get('/results/:id', app.userController.Pass, function(req, res) {
		app.subjectController.results.resultsList(req, res);
	});
    router.post('/results/:id', app.userController.Pass, function(req, res) {
		app.subjectController.results.upload(req, res);
	});
    router.post('/results/delete/:subjectId', app.userController.Pass, function(req, res) {
		app.subjectController.results.deleteResults(req, res);
	});
    router.post('/results/addPoints/:subjectId', app.userController.Pass, function(req, res) {
		app.subjectController.results.addPoints(req, res);
	});
    
    router.get('/results/assign/:id', app.userController.Pass, function(req, res) {
		app.subjectController.results.assign(req, res);
	});
    router.get('/results/api/pupils/:subjectId', app.userController.Pass, function(req, res) {
		app.subjectController.results.getPupilsForSubject(req, res);
	});
    router.get('/results/api/assign/:subjectId', app.userController.Pass, function(req, res) {
		app.subjectController.results.getResults(req, res);
	});
    
    app.use('/admin/pupils/subjects', router);
}