var async = require('async');

var BaseController = require('./baseController').BaseController;

var ResultScansController = function(mongoose, app) {

    var base = new BaseController('ResultScan', '', mongoose, app, true);
    base.path = '/admin/pupils/resultScans';
    
    base.list = list;
    base.addScanFile = addScanFile;
    base.update = update;
    base.remove = remove;
    base.getScanFile = getScanFile;

    base.updateAll = updateAll;
    base.deleteAll = deleteAll;
    
    base.constructor = arguments.callee;

    return base;

    function getScanFile(req, res) {
        app.s3filesController.getScanFile(req, res)
    }

    function update(req, res) {
        var newCode = req.body.code
        base.Collection.findByReq(req, res, function(doc) {
            console.log(newCode, doc)
            doc.code = newCode;
            doc.save(function(doc) {
                res.send(doc)
            });
        })
    }

    function updateAll(req, res) {
        var scans = req.body.data;
        async.eachSeries(scans, function (scan, asyncdone) { 
            base.Collection
                .findOne({_id: scan.id})
                .exec(function (err, doc) {
                    doc.code = scan.code;
                    doc.save(asyncdone)
                })
        }, function (err) {
            if (err) return res.status(500).send(err);
            res.status(200).send('ok');
        })
    }
    function deleteAll(req, res) {
        var subjectId = req.params.id;
        base.Collection
                .find({subject: subjectId})
                .exec(function(err, docs){
                    async.eachSeries(docs, function (doc, asyncdone) {
                        doc.remove(asyncdone)
                    }, function (err) {
                        if (err) {
                            req.session.error = 'Сканы не удалились( Что-то пошло не так.';
                        }
                        req.session.success = 'Сканы удалены';
                        res.redirect('/admin/pupils/resultScans/list/' + subjectId );
                    })
                })
        
        
    }

    function remove(req, res) {
        base.Collection.findByReq(req, res, function(doc) {
            var filename = doc.filename;
            var code = doc.code;
            var subjectId = doc.subject;
            /*TODO: delete from s3 */
            doc.remove(function() {
                req.session.success = 'Скан <strong>' + filename + '</strong> с кодом <strong>' + code + '</strong> успешно удалёно';
                res.redirect('/admin/pupils/resultScans/list/' + subjectId);
            });
        })
    }

    function addScanFile(req, res) {
        var subjectId = req.params.id;
        var scanFile = req.files.resultScan

        app.s3filesController.sendExamScan(scanFile, function(data){
            scanFile = data;

            var resultScan = new base.Collection({
                'filename' : data.fileName,
                'subject': subjectId,
                'code': data.result && data.result.number,
                'text': data.result && data.result.firstLine
            });

            resultScan.save(function (err, doc) {
                if (err) {
                    res.json({error: [err]})
                }
                else {
                    res.json(doc)
                }
            })

            
        })
    }

    function list(req, res) {
        var subjectId = req.params.id;

        app.subjectController.Collection.findByReq(req, res, function (subject) {
            base.Collection
                .find({subject: subjectId})
                .sort('-created')
                .exec(function(err, images){
                    var notNumbers = [];
                    var notFilled = [];
                    var nodVithResult = [];    
                    var doubleCheckObject = {};
                    async.eachSeries(images, function (image, asyncdone) {
                        
                        if (!image.code || image.code.length === 0) {
                            notFilled.push(image.code)   
                            image.hasDanger = true;
                        }
                        else if (!isNumeric(image.code)) {
                            notNumbers.push(image.code)
                            image.hasDanger = true;
                        } else {
                            if (!doubleCheckObject[image.code]) {
                                doubleCheckObject[image.code] = 1;
                            } else {
                                doubleCheckObject[image.code] = doubleCheckObject[image.code] + 1;
                            }
                        }  
                        app.subjectController.ResultsCollection
                            .findOne({
                                'ID': image.code,
                                'subject': subject._id 
                            }, function(err, result){
                                if (!result) {
                                    nodVithResult.push(image.code)
                                    image.hasDanger = true;
                                }
                                asyncdone(err)
                            });
                    }, function(err) {
                        var withDoubleCodes = [];
                        for (var imageCode in doubleCheckObject) {
                            if (doubleCheckObject[imageCode] > 1) {
                                withDoubleCodes.push(imageCode)
                            }
                        }
                        res.render(base.viewPath + 'tempImagesList.jade',{
                            id: subjectId,
                            // examNumber: examNumber,
                            docs: images,
                            subject: subject,
                            notFilled: notFilled,
                            notNumbers: notNumbers,
                            nodVithResult: nodVithResult,
                            withDoubleCodes: withDoubleCodes
                        });
                    });               
            });
        });
    }
};

function isNumeric(value) {
    return /^\d+$/.test(value);
}

exports.ResultScansController = ResultScansController;