module.exports = function(app) {
	
	app.get('/admin/news', function(req, res){
	  app.newsController.list(req, res);
	});
	
	app.get('/admin/news/create', function(req, res){
	  app.newsController.create(req, res);
	});
	
	app.post('/admin/news', function(req, res){
	  app.newsController.save(req, res);
	});
	
	app.put('/admin/news/:id', function(req, res){
		app.newsController.update(req, res);
	});
	
	app.get('/admin/news/:id/edit', function(req, res) {
	  app.newsController.edit(req, res);
	});
	
	app.get('/admin/news/:id/delete', function(req, res) {
	  app.newsController.remove(req, res);
	});

}
