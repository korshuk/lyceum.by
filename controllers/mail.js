var nodemailer = require('nodemailer');
var BaseController = require('./baseController').BaseController;

var MailController = function (mongoose, app) {

    var base = new BaseController('Emails', '', mongoose, app, true);

    var transporters = [];
    var senderEmails = [];
    var transportCounter = 0;

    base.list = list;
    base.update = update;
    base.mailPassRequest = mailPassRequest;
    base.mailRegisterConfirm = mailRegisterConfirm;
    base.mailDisapproved = mailDisapproved;
    base.mailApproved = mailApproved;
    base.sendExamEnvite = sendExamEnvite;

    function list(req, res) {
        var self = this;
        this.Collection.find().sort('-createdAt').limit(200).exec(function (err, docs) {
            res.render(self.viewPath + 'list.jade', {
                docs: docs,
                viewName: self.name.toLowerCase(),
                siteConfig: self.app.siteConfig
            });
        });
    }

    function sendExamEnvite(examNum) {
        app.pupilsController.Collection
            .find({status: 'approved'})
            .populate('profile')
            .populate('place1')
            .populate('place2')
            .exec(onPupilsFound);

        function onPupilsFound(err, data) {
            var pupils = data.filter(function(pupil){
                return pupil.passOlymp !== true;
            });
            var i = 0, length = pupils.length, pupil;

            console.log(data.length, pupils.length)
            for (i; i < length; i++) {
                pupil = pupils[i];
                mailExamEnvites(pupil, examNum);
            }
        }
    }

    function mailExamEnvites(pupil, examNum) {

        var param = {
            examNum: examNum,
            pupil: pupil
        };
        setTimeout(function(){
            prepareMail(pupil.email, 'mails/examEnvite.jade', param, 'Кабинет абитуриента: приглашение на экзамен');
        }, 1000);
    }

    function mailPassRequest(mailTo, param) {
        prepareMail(mailTo, 'mails/passwordRequest.jade', param, 'Запрос пароля');
    }

    function mailRegisterConfirm(mailTo, param) {
        prepareMail(mailTo, 'mails/registerConfirm.jade', param, 'Подтверждение регистрации');
    }

    function mailDisapproved(mailTo, param) {
        prepareMail(mailTo, 'mails/mailDisapproved.jade', param, 'Кабинет абитуриента: отказ в регистрации');
    }

    function mailApproved(mailTo, param) {
        prepareMail(mailTo, 'mails/mailApproved.jade', param, 'Кабинет абитуриента: сообщение о регистрации');
    }

    function prepareMail(mailTo, viewPath, param, subject) {
        var options = {
            param: param,
            subject: subject
        };

        app.render(viewPath, options, onRendered);

        function onRendered(err, html) {
            var mailOptions = {
                to: mailTo,
                subject: subject,
                html: html
            };
            sendEmail(mailOptions);
        }

    }
    
    function sendEmail(mailOptions) {
        var num = transportCounter;

        transportCounter = transportCounter + 1;
        if (transportCounter > 3) {
            transportCounter = 0;
        }
        mailOptions.from = 'Лицей БГУ Приемная Комиссия <' + senderEmails[num] + '>';

        transporters[num].sendMail(mailOptions, function (error, info) {
            var email = {};
            if (error) {
                console.log(error);
                if (error.code === 'EENVELOPE' || error.code === 'ECONNECTION') {
                    setTimeout(function(){
                        var options = mailOptions;
                        options.wasError = true;
                        sendEmail(mailOptions);
                    }, 1000);
                    return;
                }
                email.error = error;
            } else {  
                email.messageId = info.messageId;
                email.response = info.response;
            }

            email.from = mailOptions.from;
            email.to = mailOptions.to;
            email.subject = mailOptions.subject;
            email.html = mailOptions.html;
            var doc = new base.Collection(email);

            doc.save(function(err) {
                console.log('Message %s sent: %s was error %s; ecount - %s; lists - %s', email.from, email.to, mailOptions.wasError);
            });
        
        });
    }

    function update() {
        var tr;

        transporters = [];
        senderEmails = [];
        console.log('MailController update')
        for (var i = 1; i < 5; i++) {
            tr = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: app.siteConfig['email' + i],
                    pass: app.siteConfig['email' + i + 'Pass']
                }
            });
            senderEmails.push(app.siteConfig['email' + i]);
            transporters.push(tr)
        }
    }

    base.constructor = arguments.callee;

    return base;
};

exports.MailController = MailController;