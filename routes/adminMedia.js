module.exports = function(app) {
	
	app.get('/admin/media', function(req, res){
	  app.mediaController.list(req, res);
	});
	
	app.get('/admin/media/create', function(req, res){
	  app.mediaController.create(req, res);
	});
	
	app.post('/admin/media', function(req, res){
	  app.mediaController.save(req, res);
	});
	
	app.put('/admin/media/:id', function(req, res){
		app.mediaController.update(req, res);
	});
	
	app.get('/admin/media/:id/edit', function(req, res) {
	  app.mediaController.edit(req, res);
	});
	
	app.get('/admin/media/:id/delete', function(req, res) {
	  app.mediaController.remove(req, res);
	});

}
