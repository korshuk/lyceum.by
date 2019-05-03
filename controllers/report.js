/*jslint plusplus: true */
(function (exports, require) {
    'use strict';

    require('../modules/date.js');

    var ReportController;


    ReportController = function (name, path, mongoose, application, adminInPath) {
        var self = this;
        var adminPath = adminInPath ? '' : 'admin/';
        this.app = application;
        this.name = name;
        this.viewPath = this.name.toLowerCase() + '/';
        this.path = adminPath + path.toLowerCase();
        this.model = require('../models/' + this.name.toLowerCase());
        this.model.define(mongoose, function () {
            self.Collection = mongoose.model(self.name);
        });
        this.report = report;
        this.generate = generate;
        this.show = show;

    };

    function show(req, res) {
        this.Collection
            .findOne({ _id : req.params.id})
            .exec(function(err,doc){
                res.render('reports/show.jade', {
                doc: doc
            });
        })
    }

    function generate(req, res) {
        var self = this;
        var data = req.body;
        var doc = new this.Collection(req.body);

        self.app.pupilsController.pupilsList(doc.profile).exec(function (err, list) {
            console.log('err',err);
            console.log('list',list);
        self.app.render(`reports/generatedReport${doc.type}.jade`, data, onRendered);
    })

        function onRendered(err, html) {
            doc.html = html;
            doc.save(function(err, doc) {
                res.send({
                    id: doc._id
                })
            })
            
        }        
    }

    function report (req, res) {
        var self = this;
            res.render( 'reports/report.jade', {
                viewName: self.name.toLowerCase(),
                siteConfig: self.app ? self.app.siteConfig : {}
            });
    };


  exports.ReportController = ReportController;
}(exports, require));
