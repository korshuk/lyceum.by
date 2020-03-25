module.exports = function(app) {
	app.get('/admin/scanFiles/:fileName', app.userController.Pass, function(req, res){
        app.s3filesController.getScanFile(req, res);
	});
}