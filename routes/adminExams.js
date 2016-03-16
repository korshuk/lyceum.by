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
    
    app.post('/admin/exams/rest/:id/delete', app.userController.Pass, function(req, res) {
	  app.examsController.deleteExam(req, res);
	});
	
	app.get('/admin/exams/version-list', app.userController.Pass, function(req, res) {
	  app.examsController.versionList(req, res);
	});

	app.get('/admin/exams/deleteversion/:id', app.userController.Pass, function(req, res) {
	  app.examsController.deleteversion(req, res);
	});

	app.get('/admin/exams/profiles', app.userController.Pass, function(req, res) {
	  app.examsController.getProfiles(req, res);
	});

	app.post('/admin/exams/profiles', app.userController.Pass, function(req, res) {
	  app.examsController.addProfile(req, res);
	});

	app.post('/admin/exams/profiles/:id', app.userController.Pass, function(req, res) {
	  app.examsController.updateProfile(req, res);
	});

	app.post('/admin/exams/profiles/delete/:id', app.userController.Pass, function(req, res) {
	  app.examsController.deleteProfile(req, res);
	});

	app.post('/admin/exams/resultsUpload', 
		[app.userController.Pass, upload.single('csvTable')], 
		function(req, res) {
	  		app.examsController.resultsUpload(req, res);
		});
}