var json2csv = require('json2csv').parse;
var BaseController = require('./baseController').BaseController;

var PlacesController = function(mongoose, app) {

    var base = new BaseController('Places', '', mongoose, app, true);

    base.showSeats = showSeats;

    base.hideSeats = hideSeats;

    base.seatsEmailExport = seatsEmailExport;

    base.list = list;

    base.create = function (req, res) {
        var self = this,
            doc;
        if (req.session && req.session.locals && req.session.locals.doc) {
            doc = req.session.locals.doc;
            req.session.locals = {};
        } else {
            doc = new self.Collection();
        }
        var queryId = ""
        if (req.query && req.query.id) {
            queryId = req.query.id
        }
        app.profileController.Collection.find().exec(function(err, profiles) {
            res.render(self.viewPath + 'new.jade', {
                doc: doc,
                queryId:queryId,
                profiles: profiles,
                method: 'post'
            });
        });
    };

    base.edit = function (req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function (doc) {
            app.profileController.Collection.find().exec(function(err, profiles) {
                res.render(self.viewPath + 'new.jade', {
                    doc: doc,
                    method: 'put',
                    profiles: profiles
                });
            });
        });
    };

    base.save = function(req, res) {
        var self = this;
        var doc = new this.Collection(req.body);

        doc.save(function(err) {
            if (err) {
                req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                req.session.locals = {doc: doc};
                res.redirect(self.path + '/create');
            }
            else {
                req.session.success = 'Место <strong>' + doc.name + '</strong> создано ' + doc.createdAt;
                res.redirect(self.path);
            }
        });
    };

    base.update = function(req, res) {
        var self = this;

        this.Collection.findByReq(req, res, function(doc){
            doc.code = req.body.code;
            doc.name = req.body.name;
            doc.address = req.body.address;
            doc.audience = [];
            for (var i=0; i < req.body.audience.length; i++) {
                req.body.audience[i].bel = req.body.audience[i].bel === 'on';
                doc.audience.push(req.body.audience[i]);
            }
            doc.save(function(err) {
                if (err) {
                    req.session.error = 'Не получилось обновить место(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {doc: doc};
                    res.redirect(self.path + '/edit/' + doc.id);
                }
                else {
                    req.session.success = 'Место <strong>' + doc.name + '</strong> обновлено';
                    res.redirect(self.path);
                }
            });
        });
    };

    base.remove = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){
            var name = doc.name;
            doc.remove(function() {
                req.session.success = 'Место <strong>' + name + '</strong> успешно удалёно';
                res.redirect(self.path);
            });
        });
    };

    base.constructor = arguments.callee;

    return base;

    function list(req, res) {
        var self = this;
        this.Collection.find().sort('-createdAt').exec(function (err, docs) {
                var docksCount = docs.length;
                var pageNum = req.query.page || 0;
                var pagesCount = Math.ceil(docksCount / 20);
                var docsToRender = [];
                for (var i = pageNum * 20; i < pageNum * 20 + 20; i++) {
                    if (docs[i] && docs[i]. _id) {
                        docsToRender.push(docs[i])
                    }
                    
                }
                app.profileController.Collection.find().exec(function(err, profiles) {
                    res.render(self.viewPath + 'list.jade', {
                        docs: docsToRender,
                        pageNum: pageNum,
                        pagesCount: pagesCount,
                        docksCount: docksCount,
                        profiles: profiles,
                        viewName: self.name.toLowerCase(),
                        siteConfig: self.app ? self.app.siteConfig : {}
                    });
                })
                
        });
    }
    
    function seatsEmailExport(req, res) {
        var examNum = req.params.examNum;

        app.pupilsController.Collection
            .find({status: 'approved'})
            .populate('profile')
            .populate('place1')
            .populate('place2')
            .exec(onPupilsFound);

        function onPupilsFound(err, data) {
            var fields = ['email', 'firstName', 'lastName', 'profile', 'date', 'placeName', 'placeAddress', 'audience'];
            var opts = { fields: fields };
            var exportData = [];
            var csvData;
            
            var pupils = data.filter(function(pupil){
                return pupil.passOlymp !== true;
            });

            var i = 0, length = pupils.length, pupil;

            for (i; i < length; i++) {
                pupil = pupils[i];
                exportData.push(createExportData(pupil, examNum));
            }

            
            csvData = json2csv(exportData, opts);
            res.attachment('exam-seats-' + examNum +'.csv');
            res.status(200).send(csvData);
        }

        function createExportData(pupil, examNum) {
            var examName = examNum === '1' ? 'firstExamDate' : 'secondExamDate';
            var i = 0;
            var audience = '';
            var pupilAudience = pupil['audience' + examNum];
            var place = pupil['place' + examNum];
            var audienceLength = place.audience.length;
            for (i; i < audienceLength; i++) {
                if ('' + place.audience[i]._id === pupilAudience) {
                    audience = place.audience[i].name
                }
            }
            return {
                email: pupil.email,
                firstName: pupil.firstName,
                lastName: pupil.lastName,
                profile: pupil.profile.name,
                date: prettyDate(pupil.profile[examName]),
                placeName: place.name,
                placeAddress: place.address,
                audience: audience,
            };

            
        }
    }

    function showSeats(req, res) {
        var self = this;
        var showFlagName = 'showExamSeats' + req.params.examNum;
        var enableFlag = false;
        var params = {
            showExamSeats1: app.siteConfig.showExamSeats1 || false,
            showExamSeats2: app.siteConfig.showExamSeats2 || false
        };

        if (params[showFlagName] !== true) {
            enableFlag = true;
            params[showFlagName] = true;
            app.settingsController.saveSeatsFlag(params, sendResponce);
        } 
        function sendResponce(err) {
            console.log('send resp');
            if (!err) {
                req.session.success = 'Включили рассадку <strong>' + req.params.examNum + '</strong> экзамена';
            } else {
                req.session.error = 'Не получилось(( Возникли следующие ошибки: <p>' + err + '</p>';
            }

            res.redirect(self.path);
        }
    }

    function hideSeats(req, res) {
        var self = this;
        var params = {
            showExamSeats1: false,
            showExamSeats2: false
        };
        app.settingsController.saveSeatsFlag(params, sendResponce);
        function sendResponce(err) {
            if (!err) {
                req.session.success = 'Выключили рассадку';
            } else {
                req.session.error = 'Не получилось(( Возникли следующие ошибки: <p>' + err + '</p>';
            }

            res.redirect(self.path);
        }
    }

    function prettyDate(dateString){
        var d = dateString.getDate();
        var monthNames = [ "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря" ];
        var m = monthNames[dateString.getMonth()];
        var y = dateString.getFullYear();
        var dayNames = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
        var day = dayNames[dateString.getDay()];
        return d+' '+m;
    }
    
};



exports.PlacesController = PlacesController;