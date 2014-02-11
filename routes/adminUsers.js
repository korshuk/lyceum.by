module.exports = function(app) {
	
	app.get('/admin/users', app.userController.Pass, function(req, res){
	  app.userController.list(req, res);
	});

	app.get('/admin/users/create', app.userController.Pass, function(req, res){
	  app.userController.create(req, res);
	});

	app.post('/admin/users', app.userController.Pass, function(req, res){
	  app.userController.save(req, res);
	});

	app.put('/admin/users/:id', app.userController.Pass, function(req, res){
	  app.userController.update(req, res);
	});

	app.get('/admin/users/:id/edit', app.userController.Pass, function(req, res) {
	  app.userController.edit(req, res);
	});
	
	app.get('/admin/users/:id/delete', app.userController.Pass, function(req, res) {
	  app.userController.remove(req, res);
	});
}