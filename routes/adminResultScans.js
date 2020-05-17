var express = require('express');

module.exports = function(app) {
	var router = express();
	
	router.get('/delete/:id', app.userController.Pass, function(req, res) {
		app.resultScansController.remove(req, res);
	});
	router.post('/update/all', app.userController.Pass, function(req, res) {
		app.resultScansController.updateAll(req, res);
	});
	router.post('/update/:id', app.userController.Pass, function(req, res) {
		app.resultScansController.update(req, res);
	});
	router.get('/:fileName', app.userController.Pass, function(req, res) {
		app.resultScansController.getScanFile(req, res);
	});
	router.get('/:id/:examNumber', app.userController.Pass, function(req, res) {
		app.resultScansController.list(req, res);
	});
	router.post('/:id/:examNumber/upload', app.userController.Pass, function(req, res) {
		app.resultScansController.addScanFile(req, res);
	});
	router.get('/:id/:examNumber/delete-all', app.userController.Pass, function(req, res) {
		app.resultScansController.deleteAll(req, res);
	});
	

	app.use('/admin/pupils/resultScans', router);
}