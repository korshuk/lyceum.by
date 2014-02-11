module.exports = function(app) {
	
	app.get('/admin/contacts', app.userController.Pass, function(req, res){
	  app.contactsController.list(req, res);
	});
	
	app.get('/admin/contacts/create', app.userController.Pass, function(req, res){
	  app.contactsController.create(req, res);
	});
	
	app.post('/admin/contacts', app.userController.Pass, function(req, res){
	  app.contactsController.save(req, res);
	});
	
	app.put('/admin/contacts/:id', app.userController.Pass, function(req, res){
	  app.contactsController.update(req, res);
	});
	
	app.get('/admin/contacts/:id/edit', app.userController.Pass, function(req, res) {
	  app.contactsController.edit(req, res);
	});
	
	app.get('/admin/contacts/:id/delete', app.userController.Pass, function(req, res) {
	  app.contactsController.remove(req, res);
	});
/**/
}