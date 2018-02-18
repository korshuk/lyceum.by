var nodemailer = require('nodemailer');
var BaseController = require('./baseController').BaseController;

var MailController = function (mongoose, app) {

    var base = new BaseController('Emails', '', mongoose, app, true);

    var transporters = [];
    var senderEmails = [];
    var transportCounter = 0;

    base.update = update;
    base.mailPassRequest = mailPassRequest;
    base.mailRegisterConfirm = mailRegisterConfirm;

    function mailPassRequest(mailTo, param) {
        prepareMail(mailTo, 'mails/passwordRequest.jade', param, 'Запрос пароля');
    }

    function mailRegisterConfirm(mailTo, param) {
        prepareMail(mailTo, 'mails/registerConfirm.jade', param, 'Подтверждение регистрации');
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
            sendEmail(mailOptions)
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
            var email = {
                error: error,
                messageId: info.messageId,
                response: info.response,
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                html: mailOptions.html
            };

            var doc = new base.Collection(email);
            doc.save(function(err) {
                console.log('!!!!!!!!', arguments);
            });

            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
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