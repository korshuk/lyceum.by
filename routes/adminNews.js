module.exports = function(app) {
	app.get('/admin/news', app.userController.Pass, function(req, res){
	  app.newsController.list(req, res);
	});
	
	app.get('/admin/news/create', app.userController.Pass, function(req, res){
	  app.newsController.create(req, res);
	});
	
	app.post('/admin/news', app.userController.Pass, function(req, res){
	  app.newsController.save(req, res);
	});
	
	app.put('/admin/news/:id', app.userController.Pass, function(req, res){
		app.newsController.update(req, res);
	});
	
	app.get('/admin/news/:id/edit', app.userController.Pass, function(req, res) {
	  app.newsController.edit(req, res);
	});
	
	app.get('/admin/news/:id/delete', app.userController.Pass, function(req, res) {
	  app.newsController.remove(req, res);
	});

}
