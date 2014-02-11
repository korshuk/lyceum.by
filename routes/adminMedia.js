module.exports = function(app) {
	
	app.get('/admin/media', app.userController.Pass, function(req, res){
	  app.mediaController.list(req, res);
	});
	
	app.get('/admin/media/create', app.userController.Pass, function(req, res){
	  app.mediaController.create(req, res);
	});
	
	app.post('/admin/media', app.userController.Pass, function(req, res){
	  app.mediaController.save(req, res);
	});
	
	app.put('/admin/media/:id', app.userController.Pass, function(req, res){
		app.mediaController.update(req, res);
	});
	
	app.get('/admin/media/:id/edit', app.userController.Pass, function(req, res) {
	  app.mediaController.edit(req, res);
	});
	
	app.get('/admin/media/:id/delete', app.userController.Pass, function(req, res) {
	  app.mediaController.remove(req, res);
	});

}
