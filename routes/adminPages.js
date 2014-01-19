module.exports = function(app) {
	
	app.get('/admin/pages', function(req, res){
	  app.pageController.list(req, res);
	});
	
	app.get('/admin/pages/create', app.pageController.parentsHelper, function(req, res){
	  app.pageController.create(req, res);
	});
	
	app.post('/admin/pages', function(req, res){
	  app.pageController.save(req, res);
	});
	
	app.put('/admin/pages/:id', function(req, res){
	  app.pageController.update(req, res);
	});
	
	app.get('/admin/pages/:id/edit', app.pageController.parentsHelper, function(req, res) {
	  app.pageController.edit(req, res);
	});
	
	app.get('/admin/pages/:id/delete', function(req, res) {
	  app.pageController.remove(req, res);
	});

}
