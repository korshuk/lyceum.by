module.exports = function(app) {
	
	app.get('/admin/congratulations', function(req, res){
	  app.congratulationsController.list(req, res);
	});
	
	app.get('/admin/congratulations/create', function(req, res){
	  app.congratulationsController.create(req, res);
	});
	
	app.post('/admin/congratulations', function(req, res){
	  app.congratulationsController.save(req, res);
	});
	
	app.put('/admin/congratulations/:id', function(req, res){
		app.congratulationsController.update(req, res);
	});
	
	app.get('/admin/congratulations/:id/edit', function(req, res) {
	  app.congratulationsController.edit(req, res);
	});
	
	app.get('/admin/congratulations/:id/delete', function(req, res) {
	  app.congratulationsController.remove(req, res);
	});

}
