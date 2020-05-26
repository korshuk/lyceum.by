const AWS = require('aws-sdk');
const sha1 = require('sha1');
const fs = require('fs');
const Sharp = require('sharp');
const {getTextFromImage} = require('@shelf/aws-lambda-tesseract');

const CROP_OPTIONS = { 
    left: +process.env.SCAN_LEFT, 
    top: +process.env.SCAN_TOP, 
    width: +process.env.SCAN_WIDTH, 
    height: +process.env.SCAN_HEIGHT
}
const BUCKET_NAME = process.env.BUCKET_NAME
const s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
    
    const hash = sha1(new Buffer(new Date().toString()));
    const current_date = new Date()
    const year = current_date.getFullYear()
    const fileName = year + '_' + hash + Date.now() + event.fileType;
    const fileData = Buffer.from(event.base64Image, 'base64');

    
    processScanFile(fileData, fileName)
        .then(function (result) {
            callback(null, {
                result,
                fileName
            })
        })
        .catch(callback);
            

        function parseNumber(text) {
            const firstLine = text.split('\n')[0];
            let number;
            if (firstLine.indexOf('#') > -1) {
                number = firstLine.split('#').pop();
            } else {
                number = firstLine.split('(').pop().split(')')[0];
            }
        
            return {
                number,
                firstLine
            };
        }
        
        function processScanFile(fileData, fileName) {

            let smallImage = Sharp(fileData)
            
            return smallImage
                .metadata()
                .then(function (metadata) {
                    if (metadata.width > CROP_OPTIONS.left + CROP_OPTIONS.width && metadata.height > CROP_OPTIONS.top + CROP_OPTIONS.height) {
                        smallImage = smallImage.extract(CROP_OPTIONS);
                    }
                    return smallImage
                        .toFile("/tmp/small_" + fileName)
                        .then(function() {
                            return saveSmallImage(fileName);
                        })
                        .then(function() {
                            return saveFullImage(fileData, fileName);
                        })
                        .then(function () {
                            return getTextFromImage("/tmp/small_" + fileName);
                        })
                        .then(parseNumber)
                })            
        }


        function saveSmallImage(fileName) {
            const smallFile = fs.readFileSync("/tmp/small_" + fileName)
                    
            const s3paramsSmall = {
                Bucket: BUCKET_NAME,
                Key: 'small_' + fileName,
                Body: smallFile
            };
            
            return uploadScanPromiseSmall = s3.upload(s3paramsSmall).promise();
        }

        function saveFullImage(fileData, fileName) {
                    
            const s3params = {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: fileData
            };

            return s3.upload(s3params).promise();
        }
    
}

