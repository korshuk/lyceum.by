var http = require("http");
var https = require("https");

var smsOptions = {
    host: 'cp.websms.by',
    port: 80,
    path: '/?',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

var smsController = function (mongoose, app) {

    this.sendVerificationCode = sendVerificationCode;


    function sendVerificationCode(pupilPhone, code) {
        var phone = pupilPhone.match(/\d+/g).join('');

        console.log('Send verification code', phone, code )

        sendSMS({
            r: 'api/msg_send',
            user: app.siteConfig.smsAPILogin,
            apikey: app.siteConfig.smsAPIKey,
            sender: app.siteConfig.smsAPIName,
            recipients: phone,
            message: 'Vash kod: ' + code
        },onSMSSend);
    }

    function onSMSSend(status, data) {
        console.log('!!!!!!!!!', status, data)
    }

};

/* getJSON:  REST get request returning JSON object(s)
* @param options: http options object
* @param callback: callback to pass the results JSON object(s) back
*/
function sendSMS(params, next) {
    var options = smsOptions;
    console.log("rest::getJSON");

    var port = options.port === 443 ? https : http;


    options.path = options.path + serialize(params);
    console.log('path',  options.path);
    var req = port.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            next(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        next('error', err);
    });

    req.end();
}

function serialize(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}

exports.smsController = smsController;