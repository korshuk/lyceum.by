module.exports = function(app) {
	
    app.get('/admin/settings', app.userController.Pass, function(req, res){
      app.settingsController.list(req, res);
	});
	
	app.post('/admin/settings', app.userController.Pass, function(req, res){
	  app.settingsController.save(req, res);
	});

    app.get('/admin/settings/calculateStats', app.userController.Pass, function(req, res){
        app.sotkaController.calculateStats(req, res);
    });

}