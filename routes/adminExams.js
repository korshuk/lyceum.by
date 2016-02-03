var multer = require('multer');
var upload = multer({ dest: 'scv-uploads/' })

module.exports = function(app) {
	
	app.get('/admin/exams', app.userController.Pass, function(req, res) {
	  app.examsController.list(req, res);
	});

	app.get('/admin/exams/rest', app.userController.Pass, function(req, res) {
	  app.examsController.listRest(req, res);
	});

	app.get('/admin/exams/rest/:id', app.userController.Pass, function(req, res) {
	  app.examsController.getExam(req, res);
	});

	app.post('/admin/exams/rest/:id', app.userController.Pass, function(req, res) {
	  app.examsController.updateExam(req, res);
	});
	
	app.get('/admin/exams/version-list', app.userController.Pass, function(req, res) {
	  app.examsController.versionList(req, res);
	});

	app.get('/admin/exams/deleteversion/:id', app.userController.Pass, function(req, res) {
	  app.examsController.deleteversion(req, res);
	});

	app.post('/admin/exams/resultsUpload', 
		[app.userController.Pass, upload.single('csvTable')], 
		function(req, res) {
	  		app.examsController.resultsUpload(req, res);
		});
}