var BaseController = require('./baseController').BaseController;

var SettingsController = function(mongoose, app) {

    var base = new BaseController('Settings', 'settings', mongoose, app);

    base.list = function(req, res) {
        var self = this;
        this.Collection.find().sort('-createdAt').exec(function(err, docs) {
            console.log(docs[0])
            res.render(self.viewPath + 'list.jade', {
                docs: docs[0],
                viewName: 'settings'
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

            doc.showPupilCabinet = req.body.showPupilCabinet === 'on';
            doc.showStats = req.body.showStats === 'on';
            doc.clientAppName = req.body.clientAppName;
            doc.clientAppSecret = req.body.clientAppSecret;
            doc.registrationEndDate = req.body.registrationEndDate;
            doc.confirmationEndDate = req.body.confirmationEndDate;
            doc.rulesLink = req.body.rulesLink;
            doc.rulesHTML = req.body.rulesHTML;
            doc.email1 = req.body.email1;
            doc.email1Pass = req.body.email1Pass;
            doc.email2 = req.body.email2;
            doc.email2Pass = req.body.email2Pass;
            doc.email3 = req.body.email3;
            doc.email3Pass = req.body.email3Pass;
            doc.email4 = req.body.email4;
            doc.email4Pass = req.body.email4Pass;
            doc.superPassword = req.body.superPassword;
            doc.reSiteKey = req.body.reSiteKey;
            doc.smsAPIKey = req.body.smsAPIKey;
            doc.smsAPILogin = req.body.smsAPILogin;
            doc.smsAPISecretCode = req.body.smsAPISecretCode;
            doc.smsAPIName = req.body.smsAPIName;
            doc.private_key = req.body.privateKey.replace(new RegExp('\\r', 'g'), '');
            doc.client_email = req.body.client_email;
            doc.client_secret = req.body.client_secret;
            doc.client_id = req.body.client_id;
            doc.redirect_uris = req.body.redirect_uris;
            doc.scope = req.body.scope;


            base.client.private_key = doc.privateKey;
            base.client.client_email = doc.client_email;
            base.client.client_secret = doc.client_secret;
            base.client.client_id = doc.client_id;
            base.client.redirect_uris = doc.redirect_uris;
            base.client.scope = doc.scope;
            console.log(base.client);

            doc.save(function(err, d) {
                app.siteConfig = doc;
                base.app.siteConfig.startTime = Date.now();
                app.mailController.update();
                app.superCash = {};
                res.redirect(self.path);
            });
        });
    };

    base.saveSeatsFlag = function(params, next) {
        this.Collection.find().sort('-createdAt').exec(function(err, docs) {
            var doc = docs[0];
            doc.showExamSeats1 = params.showExamSeats1;
            doc.showExamSeats2 = params.showExamSeats2;
            doc.save(function(err, d){
                app.siteConfig = d;
                next(err);
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
        base.client.private_key = doc.private_key;
        base.client.client_email = doc.client_email;
        base.client.client_secret = doc.client_secret;
        base.client.client_id = doc.client_id;
        base.client.redirect_uris = doc.redirect_uris;
        base.client.scope = doc.scope;
        base.app.contactsController.client = base.client;

        base.app.siteConfig = doc;
        base.app.siteConfig.startTime = Date.now();
        base.app.mailController.update();
    });


    return base;
};



exports.SettingsController = SettingsController;