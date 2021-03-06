(function(exports, require) {
    'use strict';

    var ResultsController;

    ResultsController = function(mongoose, application) {
        this.viewPath = 'results/';
        this.app = application;
    }

    ResultsController.prototype.show = function(req, res) {
        var self = this;
        if (this.app.siteConfig.showPupilCabinet) {
            res.render(self.viewPath + 'show.jade', {
                docs: 'docs',
            });
        } else {
            res.redirect('/404.html')
        }
    }


    exports.ResultsController = ResultsController;
} (exports, require));