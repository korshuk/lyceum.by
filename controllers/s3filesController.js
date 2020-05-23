/*jslint node: true */
(function (exports, require) {
    'use strict';
   
    var fs = require('fs');
    var https = require("https");
    var aws = require('aws-sdk');
    //var stream = require('stream')

    

    var S3filesController = function (mongoose, app) {       
        /*this.s3 = new aws.S3({
            accessKeyId: app.siteConfig.s3AccessKeyId,
            secretAccessKey: app.siteConfig.s3SecretAccessKey
        });

        this.options = {
            scans: {
                hostname: app.siteConfig.s3Hostname,//'xfc65yvpd9.execute-api.ca-central-1.amazonaws.com',
                path: '/prod/upload',
                Bucket: 'examscans'
            }
        }*/

        this.sendExamScan = sendExamScan;
        this.getScanFile = getScanFile;
        this.updateCredentials = updateCredentials;

        function updateCredentials() {
            this.s3 = new aws.S3({
                accessKeyId: app.siteConfig.s3AccessKeyId,
                secretAccessKey: app.siteConfig.s3SecretAccessKey
            });
    
            this.options = {
                scans: {
                    hostname: app.siteConfig.s3Hostname,
                    path: '/prod/upload',
                    Bucket: 'examscans'
                }
            }
        }
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
                    "Content-Type": contentType,//'application/x-www-form-urlencoded',
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
            this.s3.getObject(getParams, function (err, data) {
                if (err) {
                    res.status(404).send(err);
                } else {
                    res.writeHead(200,{'Content-type':'image/png'});
                    res.end(data.Body);
                }
            })
        }
    }

    exports.S3filesController = S3filesController;

}(exports, require));