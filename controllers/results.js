(function (exports, require) {
    'use strict';

    var ResultsController;
	
	ResultsController = function(mongoose, application) {
		this.viewPath = 'results/';
        this.app = application;
	}
	
	ResultsController.prototype.show = function (req, res) {
		var self = this;
        this.app.settingsController.Collection.find().sort('-createdAt').exec(function (err, settings) {
            if (settings[0].showPupilCabinet) {
                res.render(self.viewPath + 'show.jade', {
                    docs: 'docs',
                });
            } else {
                res.redirect('/404.html')
            }
        });
	}


	exports.ResultsController = ResultsController;
}(exports, require));