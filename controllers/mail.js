var nodemailer = require('nodemailer');

var MailController = function(mongoose, app) {
    console.log('MailController', app.siteConfig);

    var transporters = [];
    var senderEmails = [];
    var transportCounter = 0;

    this.update = update;
    this.mailPassRequest = mailPassRequest;
    this.mailRegisterConfirm = mailRegisterConfirm;

    function mailPassRequest(mailTo, param) {
        prepareMail(mailTo, 'mails/passwordRequest.jade', param, 'Запрос пароля');
    }

    function mailRegisterConfirm(mailTo, param) {
        prepareMail(mailTo, 'mails/registerConfirm.jade', param, 'Подтверждение регистрации');
    }

    function prepareMail(mailTo, viewPath, param, subject) {
        app
            .render(viewPath, {
                    param: param,
                    subject: subject
                },
                function (err, html) {
                    console.log(err, html)
                    var mailOptions = {
                        to: mailTo,
                        subject: subject,
                        html: html
                    };
                    sendEmail(mailOptions)
                });
    }

    function sendEmail(mailOptions) {
        var num = transportCounter;

        transportCounter = transportCounter + 1;
        if (transportCounter > 3) {
            transportCounter = 0;
        }
        mailOptions.from = 'Лицей БГУ Приемная Комиссия <' + senderEmails[num] + '>';

        transporters[num].sendMail(mailOptions, function(error, info)  {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }

    function update() {
        var tr;

        transporters = [];
        senderEmails = []
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


};

exports.MailController = MailController;