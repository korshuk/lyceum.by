const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sha1 = require('sha1');

exports.handler = (event, context, callback) => {

    let s3params = {
        Bucket: 'examscans',
        Key: 'qwqeqwe.jpg',
        Body: Buffer.from(event.base64Image, 'base64')
    }

    s3.upload(s3params, function (err, data) {
        if (err) {
            callback(err);
        } else {
            let response = {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
                "data": data
            };
            callback(null, response);
        }
    });
}

let getFile = function (fileData) {

    let hash = sha1(new Buffer(new Date().toString()));

    let fileName = hash + Date.now() + '_' + fileData.filename;
    let fileFullPath = 'images/' + fileName;

    let params = {
        Bucket: 'examscans',
        Key: fileFullPath,
        Body: fileData.content.toString('base64')
    };

    let uploadFile = {
        size: fileData.content.toString('ascii').length,
        type: fileData.contentType,
        name: fileName,
        full_path: fileFullPath
    }

    return {
        'params': params,
        'uploadFile': uploadFile
    }
}

/*
const AWS = require('aws-sdk');
const multipart = require('aws-lambda-multipart-parser');

// get reference to S3 client 
var s3 = new AWS.S3();
exports.handler = (event, context, callback) => {
    const x = 1;
    const decodedImage = Buffer.from(event['body-json'], 'base64');
    const originalFileName = "test.jpg";
    const filePath = "scans/" + originalFileName;
    
    
    const params = {
       "Body": decodedImage,
       "Bucket": "examscans",
       "ContentType": 'image/jpeg',
       "Key": filePath  
    };
    
    s3.upload(params, function(err, data){
        let response;
        if(err) {
           response = {
               "statusCode": 500,
                "headers": {
                    "my_header": "my_value",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": JSON.stringify(err),
                "isBase64Encoded": false
           }
        } else {
           response = {
                "statusCode": 200,
                "headers": {
                    "my_header": "my_value",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": event['body-json'],
                "data": data,
                "isBase64Encoded": false
            };
        }
        callback(null, response);
    });
};
*/


function getValueIgnoringKeyCase(object, key) {
    const foundKey = Object
        .keys(object)
        .find(currentKey => currentKey.toLocaleLowerCase() === key.toLowerCase());
    return object[foundKey];
}

function getBoundary(headers) {
    return getValueIgnoringKeyCase(headers, 'Content-Type').split('=')[1];
}

function parse(data, boundary, spotText) {
    const result = {};
    data
        .split(boundary)
        .forEach(item => {
            if (/filename=".+"/g.test(item)) {
                result[item.match(/name=".+";/g)[0].slice(6, -2)] = {
                    type: 'file',
                    filename: item.match(/filename=".+"/g)[0].slice(10, -1),
                    contentType: item.match(/Content-Type:\s.+/g)[0].slice(14),
                    content: spotText? Buffer.from(item.slice(item.search(/Content-Type:\s.+/g) + item.match(/Content-Type:\s.+/g)[0].length + 4, -4), 'binary'):
                        item.slice(item.search(/Content-Type:\s.+/g) + item.match(/Content-Type:\s.+/g)[0].length + 4, -4),
                };
            } else if (/name=".+"/g.test(item)){
                result[item.match(/name=".+"/g)[0].slice(6, -1)] = item.slice(item.search(/name=".+"/g) + item.match(/name=".+"/g)[0].length + 4, -4);
            }
        });
    return result;
};