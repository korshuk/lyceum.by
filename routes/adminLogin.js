module.exports = function(app) {
	
	app.get('/admin', function(req, res) {
	  res.render('admin/login');
	});
	
	app.post('/admin', function(req, res) {
	  app.userController.authenticate(req.body.username, req.body.password, req, res);
	});
	
	app.get('admin/logout', function(req, res){
	  app.userController.logout(req, res);
	});
}
