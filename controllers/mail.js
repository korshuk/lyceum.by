var fs = require('fs');
var nodemailer = require('nodemailer');
var moment = require("moment");
moment.locale('ru');

var winston = require('winston');
winston.remove(winston.transports.Console);    
    
   


var BaseController = require('./baseController').BaseController;

var MailController = function (mongoose, app) {

    
    var base = new BaseController('Emails', '', mongoose, app, true);

    var transporters = [];
    var senderEmails = [];
    var transportCounter = 0;

    var logfile = global.rootDir + '/mails_log.json';
    var mailTimesFile = global.rootDir + '/mailTimes.json';
    winston.add(winston.transports.File, { filename: logfile});
    base.logger = winston;

    base.list = list;
    base.emailSenderPage = emailSenderPage;
    base.update = update;
    base.mailPassRequest = mailPassRequest;
    base.mailRegisterConfirm = mailRegisterConfirm;
    base.mailDisapproved = mailDisapproved;
    base.mailApproved = mailApproved;

    base.sendInvites = sendInvites;
    base.sendEmailsToNew = sendEmailsToNew;
    base.logDownload = logDownload;
    base.logClear = logClear;


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
    function emailSenderPage(req, res) {
        var self = this;
        req.query.page = 1;
        req.query.itemsPerPage = 10000;
        
        req.query.status = 'new';
        app.pupilsController.Collection.simpleSearch(req, res, function(err, resultsNew){
            var newPupilsCount = resultsNew[1];
            
            req.query.status = 'approved';
            app.pupilsController.Collection.simpleSearch(req, res, function(err, resultsApproved){
                var pupils = resultsApproved[0];
                var approvedPupilsCount = resultsApproved[1];
                
                var profilesData = {};

                var profileId;
                var today = new Date();

                for(var i = 0; i < pupils.length; i++) {
                    profileId = pupils[i].profile._id;
                    if (!profilesData[profileId]) {
                        profilesData[profileId] = {
                            id: pupils[i].profile._id,
                            name: pupils[i].profile.name,
                            count: 0,
                            audience1: 0,
                            audience2: 0,
                            olympCount: 0,
                            firstExamDate: pupils[i].profile.firstExamDate,
                            secondExamDate: pupils[i].profile.secondExamDate,
                            firstDelta: pupils[i].profile.firstExamDate.getTime() - today.getTime(),
                            secondDelta: pupils[i].profile.secondExamDate.getTime() - today.getTime()
                        }
                    } 
                    profilesData[profileId].count = profilesData[profileId].count + 1;

                    if (pupils[i].audience1) {
                        profilesData[profileId].audience1 = profilesData[profileId].audience1 + 1;
                    }

                    if (pupils[i].audience2) {
                        profilesData[profileId].audience2 = profilesData[profileId].audience2 + 1;
                    }

                    if (pupils[i].passOlymp) {
                        profilesData[profileId].olympCount = profilesData[profileId].olympCount + 1;
                    }
                }                

                res.render(self.viewPath + 'emailSender.jade', {
                    viewName: self.name.toLowerCase(),
                    newPupilsCount: newPupilsCount,
                    approvedPupilsCount: approvedPupilsCount,
                    siteConfig: self.app.siteConfig,
                    profilesData: profilesData,
                    toNewLastTime: getMailTime('toNew')
                });
            })
            
            
        })
    }

    function sendEmailsToNew(req, res) {
        req.query.page = 1;
        req.query.itemsPerPage = 10000;
        
        req.query.status = 'new';
        app.pupilsController.Collection.simpleSearch(req, res, function(err, resultsNew){
            if (err) {
                req.session.error = 'Что-то пошло не так!';
            } else {
                req.session.success = 'Рассылка писем с напоминанием о регистрации началась';
                var pupils = resultsNew[0];
                var endPeriod = moment(app.siteConfig.registrationEndDate).fromNow();
                
                updateMailTime('toNew');

                for(var i=0; i <  pupils.length; i++) {
                    var param = {
                        endPeriod: endPeriod,
                        registrationEndDate: app.siteConfig.registrationEndDate,
                        registrationVideoLink: app.siteConfig.registrationVideoLink
                    };
                    var pupil = pupils[i]
                    setTimeout(function(){
                        prepareMail(pupil.email, 'mails/reminderMail.jade', param, 'Кабинет абитуриента: напоминание');
                    }, 500);
                }
            }
           
            res.redirect('/admin/pupils/emails/list');
        });
    }

    function sendInvites(req, res) {
        var examNum = req.params.examNumber;
        console.log(req.params.examNumber, req.params.profileId)
        app.pupilsController.Collection
            .find({status: 'approved', profile: req.params.profileId})
            .populate('profile')
            .populate('place1')
            .populate('place2')
            .exec(function (err, pupils) {
                if (err) {
                    req.session.error = 'Что-то пошло не так!';
                    console.log(err)
                } else {
                    if (pupils.length > 0) {
                        req.session.success = 'Рассылка писем с приглашением на ' + req.params.examNumber + ' экзамен для профиля "' +pupils[0].profile.name + '" началась';
                        for(var i = 0; i < pupils.length; i++) {
                            var pupil = pupils[i];
                            if (pupil.passOlymp !== true) {
                                mailExamEnvite(pupil, examNum);
                            }
                            
                        }
                    }
                    
                }
                res.redirect('/admin/pupils/emails/list');
            })
        
    }

    function mailExamEnvite(pupil, examNum) {

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
            if (err) {
                console.log(err)
            }
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
            
            if (error) {
                base.logger.error({ error: error, email: mailOptions });
            }
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

    function logClear(req, res) {
        fs.writeFile(logfile, '', function(err){
            res.redirect('/admin/pupils/emails/list');
        })
        
    }
    
    function logDownload(req, res) {
        res.download(logfile);
    }

    function updateMailTime(type) {
        var timeData = fs.readFileSync(mailTimesFile, 'utf8');
        if (!timeData) {
            timeData = {};
        } else {
            timeData = JSON.parse(timeData);
        }
        timeData[type] = new Date();
        fs.writeFileSync(mailTimesFile, JSON.stringify(timeData))
    }

    function getMailTime(type) {
        var timeData = fs.readFileSync(mailTimesFile, 'utf8');
        return new Date(JSON.parse(timeData)[type])
    }
    base.constructor = arguments.callee;

    return base;
};

exports.MailController = MailController;