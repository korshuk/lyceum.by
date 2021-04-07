/*jslint node: true */
(function (exports, require) {
    'use strict';
   
    var fs = require('fs');
    var https = require("https");
    var aws = require('aws-sdk');
    var crypto = require("crypto");
    var Jimp = require('jimp');
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
        this.uploadRequestPhoto = uploadRequestPhoto;
        this.sendRequestBufferToS3 = sendRequestBufferToS3;
        this.getRequestPhoto = getRequestPhoto;
        this.requestResizeAndGetBuffer = requestResizeAndGetBuffer

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
                },
                requests: {
                    Bucket: 'requestsphotos'
                }
            }
        }

        function uploadRequestPhoto(req, res) {
            var self = this;
            var filePath = req.files.file.path;
            var filename = req.user.userId + '-' + Date.now() + '-' + crypto.randomBytes(8).toString("hex") + '.png';

            new Jimp(filePath, function(err, image) {
                if (err) {
                    res.status(500).json({
                        message: 'error in file read: ' + err
                    })
                }

                self.requestResizeAndGetBuffer(req, res, image, function(err, fileData) {
                    fs.unlink(filePath);
                    if (err) {
                        res.status(500).json({
                            message: 'error in file resize'
                        })
                    } else {
                        self.sendRequestBufferToS3(req, res, filename, fileData)
                    }
                })
            });
        }

        function requestResizeAndGetBuffer(req, res, image, next) {
            image
                .resize(800, Jimp.AUTO)
                .getBuffer(Jimp.MIME_PNG, function (err, fileData) {
                    next(err, fileData)
                })
        }

        function sendRequestBufferToS3(req, res, filename, fileData) {
            var self = this;
            var params = {
                Bucket: self.options.requests.Bucket,
                Key: filename,
                Body: fileData
            };

            self.s3.upload(params, function(err, data) {
                if (err) {
                    res.status(500).json({
                        message: 'error in file upload'
                    })
                } else {
                    res.json({
                        filename: filename
                    })
                }
            });
                
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
        function getRequestPhoto(req,res) {
            var fileName = req.params.filename;

            var getParams = {
                Bucket: this.options.requests.Bucket,
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