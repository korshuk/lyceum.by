var BaseController = require('./baseController').BaseController;

var VISIBLE_FOR_CABINET = [
    'registrationEndDate',
    'confirmationEndDate',
    'rulesOlympPoint',
    'rulesLink',
    'rulesHTML',
    'logRocket',
    'reservedDayDate',
    'absentDocumentsDate'
]

var SettingsController = function(mongoose, app) {

    var base = new BaseController('Settings', 'settings', mongoose, app);

    var CACHE = {
        profiles: {
            list: [],
            counter: 0,
            limit: 3
        }
    }
    base.v2 = {
        getCurrent: getCurrent_v2,
        getCommon: getCommon_v2
        
    }
    
    base.list = function(req, res) {
        var self = this;
        this.Collection.find().sort('-createdAt').exec(function(err, docs) {
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
            doc.reservedDayDate = req.body.reservedDayDate;
            doc.absentDocumentsDate = req.body.absentDocumentsDate;
            doc.totalResultsDate = req.body.totalResultsDate;
            doc.endDocumentsDate = req.body.endDocumentsDate;
            doc.helloMessage = req.body.helloMessage;
            doc.anketaLink = req.body.anketaLink;
            doc.rulesLink = req.body.rulesLink;
            doc.rulesOlympPoint = req.body.rulesOlympPoint;
            doc.rulesHalfPassPoint = req.body.rulesHalfPassPoint;
            doc.rulesClassPoint = req.body.rulesClassPoint;
            doc.rulesOlympPassPoint = req.body.rulesOlympPassPoint;
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
            doc.smsTemplate = req.body.smsTemplate;
            doc.agreement = req.body.agreement;
            doc.registrationVideoLink = req.body.registrationVideoLink;
            doc.appelationFormLink = req.body.appelationFormLink;
            doc.s3AccessKeyId = req.body.s3AccessKeyId
            doc.s3SecretAccessKey = req.body.s3SecretAccessKey
            doc.s3Hostname = req.body.s3Hostname
            doc.reCaptchaSite = req.body.reCaptchaSite
            doc.reCaptchaSecret = req.body.reCaptchaSecret
            doc.corsUrls = req.body.corsUrls
            doc.logRocket = req.body.logRocket

            doc.save(function(err, d) {
                app.siteConfig = doc;
                base.app.siteConfig.startTime = Date.now();
                app.mailController.update();
                app.s3filesController.updateCredentials();
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
        base.app.siteConfig = doc;
        base.app.siteConfig.startTime = Date.now();
        base.app.mailController.update();
        base.app.s3filesController.updateCredentials();
    });

    
    return base;

    function getCurrent_v2(req, res) {
        var data = {};
        data.dateNow = new Date();
        fillConfigForAjax(data);
        
        if (CACHE.profiles.list && CACHE.profiles.list.length > 0) {
            data.profiles = CACHE.profiles.list;
            CACHE.profiles.counter = CACHE.profiles.counter + 1;
            
            res.json({config: data});
            
            console.log('CACHE.profiles.counter', CACHE.profiles.counter, CACHE.profiles.limit)
            
            if (CACHE.profiles.counter >= CACHE.profiles.limit) {
                app.profileController.Collection
                    .findAllForAjax(req, res, function(profiles){
                        console.log('CACHE.profiles.counter findAllForAjax')
                        CACHE.profiles.list = profiles;
                        CACHE.profiles.counter = 0;
                    })
            }
        } else {
            app.profileController.Collection
                .findAllForAjax(req, res, function(profiles){
                    CACHE.profiles.list = profiles
                    data.profiles = CACHE.profiles.list;
                    res.json({config: data});
                })
        }
        
        
        
    }

    function fillConfigForAjax(config) {
        for(var i = 0; i < VISIBLE_FOR_CABINET.length; i++) {
            config[VISIBLE_FOR_CABINET[i]] = app.siteConfig[VISIBLE_FOR_CABINET[i]]
        }
    }

    function getCommon_v2(req, res) {
        var isRegistration = false;
        if (app.siteConfig.registrationEndDate) {
            isRegistration = new Date() <= new Date(app.siteConfig.registrationEndDate)
        }
        res.json({
            config: {
                isRegistration: isRegistration,
                reCaptchaSite: app.siteConfig.reCaptchaSite
            }
        })
    }

    
};



exports.SettingsController = SettingsController;