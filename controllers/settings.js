var BaseController = require('./baseController').BaseController;

SettingsController = function(mongoose, app) {

    var base = new BaseController('Settings', 'settings', mongoose, app);

    base.list = function(req, res) {
        var self = this;
        this.Collection.find().sort('-createdAt').exec(function(err, docs) {
            res.render(self.viewPath + 'list.jade', {
                docs: docs[0]
            });
        });
    };

    base.save = function(req, res) {
        var self = this;
        var doc;
        this.Collection.find().sort('-createdAt').exec(function(err, docs) {
            if (docs.length > 0) {
                doc = docs[0];
            } else {
                doc = new base.Collection();
            }
            doc.showPupilCabinet = req.body.showPupilCabinet == 'on' ? true : false;
            doc.save(function(err, d) {
                base.app.siteConfig = doc;
                res.redirect(self.path);
            });
        });
    };

    base.constructor = arguments.callee;

    base.Collection.find().sort('-createdAt').exec(function(err, docs) {
        var doc;
        if (docs.length > 0) {
            doc = docs[0];
        } else {
            doc = new base.Collection();
            doc.save();
        }
        base.app.siteConfig = doc;
        console.log(base.app.siteConfig);
    });


    return base;
};



exports.SettingsController = SettingsController;