var express = require('express'),
	moment = require('moment');

module.exports = function(app) {

	var router = express();
	router.locals.moment = moment;
	router.get('/', app.userController.Pass, function(req, res) {
		app.profileController.list(req, res);
	});

	router.get('/create', app.userController.Pass, function(req, res) {
		app.profileController.create(req, res);
	});

	router.get('/delete/:id', app.userController.Pass, function(req, res) {
		app.profileController.remove(req, res);
	});

	router.get('/edit/:id', app.userController.Pass, function(req, res) {
		app.profileController.edit(req, res);
	});

	router.get('/results/:id/:examNumber', app.userController.Pass, function(req, res) {
		app.profileController.results.resultsList(req, res);
	});
	router.post('/results/:id/:examNumber', app.userController.Pass, function(req, res) {
		app.profileController.results.upload(req, res);
	});
	router.post('/results/scans/:id/:examNumber', app.userController.Pass, function(req, res) {
		app.profileController.results.uploadScans(req, res);
	});
	router.post('/results/addPoints/:id/:examNumber', app.userController.Pass, function(req, res) {
		app.profileController.results.addPoints(req, res);
	});

	router.get('/results/scans/delete/:id/:examNumber/:resultId', app.userController.Pass, function(req, res) {
		app.profileController.results.deleteScan(req, res);
	})

	router.get('/results/assign/:id/:examNumber', app.userController.Pass, function(req, res) {
		app.profileController.results.assign(req, res);
	});

	router.get('/results/api/assign/:id/:examNumber', app.userController.Pass, function(req, res) {
		app.profileController.results.getResults(req, res);
	});

	router.post('/', app.userController.Pass, function(req, res) {
		app.profileController.save(req, res);
	});

	router.put('/:id', app.userController.Pass, function(req, res) {
		app.profileController.update(req, res);
	});

	app.use('/admin/pupils/profiles', router);
};