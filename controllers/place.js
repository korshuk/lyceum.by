var BaseController = require('./baseController').BaseController;

var PlacesController = function(mongoose, app) {

    var base = new BaseController('Places', '', mongoose, app, true);

    base.showSeats = showSeats;

    base.hideSeats = hideSeats;

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

            app.mailController.sendExamEnvite(req.params.examNum);

        } 
        function sendResponce(err) {
            console.log('send resp')
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
};



exports.PlacesController = PlacesController;