module.exports = function(app) {
	app.get('/admin/files', app.userController.Pass, function(req, res){
	  app.fileController.list(req, res);
	});

	app.get('/admin/files/:name/delete', app.userController.Pass, function(req, res) {
	  app.fileController.remove(req, res);
	});

	app.post('/admin/files', app.userController.Pass, function(req, res){
	  app.fileController.upload(req, res);
	});
}