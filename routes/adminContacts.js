module.exports = function(app) {
	
	app.get('/admin/contacts', function(req, res){
	  app.contactsController.list(req, res);
	});
	
	app.get('/admin/contacts/create', function(req, res){
	  app.contactsController.create(req, res);
	});
	
	app.post('/admin/contacts', function(req, res){
	  app.contactsController.save(req, res);
	});
	
	app.put('/admin/contacts/:id', function(req, res){
	  app.contactsController.update(req, res);
	});
	
	app.get('/admin/contacts/:id/edit', function(req, res) {
	  app.contactsController.edit(req, res);
	});
	
	app.get('/admin/contacts/:id/delete', function(req, res) {
	  app.contactsController.remove(req, res);
	});
/**/
}