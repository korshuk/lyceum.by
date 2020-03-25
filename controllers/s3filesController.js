/*jslint node: true */
(function (exports, require) {
    'use strict';
   
    var fs = require('fs');
    var https = require("https");
    var aws = require('aws-sdk');
    
    var s3 = new aws.S3({
        accessKeyId: '',
        secretAccessKey: ''
    });

    var S3filesController = function (mongoose, app) {
        console.log('s3 start');

        this.options = {
            common: {

            },
            scans: {
                hostname: 'xfc65yvpd9.execute-api.ca-central-1.amazonaws.com',
                path: '/prod/upload',
                Bucket: 'examscans'
            }
        }

        this.sendExamScan = sendExamScan;
        this.getScanFile = getScanFile;

        function sendExamScan(scanFile, next) {
            var contentType = scanFile.headers['content-type']
            var fileData = fs.readFileSync(scanFile.path)
            fs.unlinkSync(scanFile.path)

            var options = {
                hostname: this.options.scans.hostname,
                path: this.options.scans.path,
                method: 'POST',
                headers: {
                    "Accept": '*/*',
                    "Content-Type": contentType,
                    'Content-Length': fileData.length
                }
            };


            var request = https.request(options, function (response) {
                var output = '';
                response.on('data', function (chunk) {
                    output += chunk;
                });
                response.on('end', function () {
                    next(JSON.parse(output))
                });
                request.on('error', function (e) {
                    console.error(e);
                });
            });

            request.write(fileData);
            request.end();
        }

        function getScanFile(req, res) {
            var fileName = req.params.fileName;

            var getParams = {
                Bucket: this.options.scans.Bucket,
                Key: fileName
            }
            s3.getObject(getParams, function (err, data) {
                if (err) {
                    console.log('eee', err);
                } else {
                    console.log('wwwww', data.Body);
                }
            })
        }
    }

    exports.S3filesController = S3filesController;

}(exports, require));