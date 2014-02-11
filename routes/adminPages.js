module.exports = function(app) {
	
	app.get('/admin/pages', app.userController.Pass, function(req, res){
	  app.pageController.list(req, res);
	});
	
	app.get('/admin/pages/create', [app.userController.Pass, app.pageController.parentsHelper], function(req, res){
	  app.pageController.create(req, res);
	});
	
	app.post('/admin/pages', app.userController.Pass, function(req, res){
	  app.pageController.save(req, res);
	});
	
	app.put('/admin/pages/:id', app.userController.Pass, function(req, res){
	  app.pageController.update(req, res);
	});
	
	app.get('/admin/pages/:id/edit', [app.userController.Pass, app.pageController.parentsHelper], function(req, res) {
	  app.pageController.edit(req, res);
	});
	
	app.get('/admin/pages/:id/delete', app.userController.Pass, function(req, res) {
	  app.pageController.remove(req, res);
	});

}
