var async = require('async');

var BaseController = require('./baseController').BaseController;

var ResultScansController = function(mongoose, app) {

    var base = new BaseController('ResultScan', '', mongoose, app, true);
    base.path = '/admin/pupils/resultScans';
    
    base.getScanFile = getScanFile;
    base.addScanFile = addScanFile;
    base.list = list;
    base.remove = remove;
    base.update = update;
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
        var profileId = req.params.id;
        var examNumber = req.params.examNumber;
        base.Collection
                .find({profile: profileId, examNum: examNumber})
                .exec(function(err, docs){
                    async.eachSeries(docs, function (doc, asyncdone) {
                        doc.remove(asyncdone)
                    }, function (err) {
                        if (err) {
                            req.session.error = 'Сканы не удалились( Что-то пошло не так.';
                        }
                        req.session.success = 'Сканы удалены';
                        res.redirect('/admin/pupils/resultScans/' + profileId + '/' + examNumber);
                    })
                })
        
        
    }

    function remove(req, res) {
        base.Collection.findByReq(req, res, function(doc) {
            var filename = doc.filename;
            var code = doc.code;
            var examNum = doc.examNum;
            var profile = doc.profile;
            /*TODO: delete from s3 */
            doc.remove(function() {
                req.session.success = 'Скан <strong>' + filename + '</strong> с кодом <strong>' + code + '</strong> успешно удалёно';
                res.redirect('/admin/pupils/resultScans/' + profile + '/' + examNum);
            });
        })
    }

    function addScanFile(req, res) {
        var profileId = req.params.id;
        var examNumber = req.params.examNumber;
        var scanFile = req.files.resultScan

        app.s3filesController.sendExamScan(scanFile, function(data){
            scanFile = data;

            var resultScan = new base.Collection({
                'filename' : data.fileName,
                'profile': profileId,
                'examNum': examNumber,
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
        var profileId = req.params.id;
        var examNumber = req.params.examNumber;
        app.profileController.Collection.findByReq(req, res, function (profile) {
            base.Collection
                .find({profile: profileId, examNum: examNumber})
                .sort('-created')
                .exec(function(err, images){
                    var i = 0,
                        image,
                        length = images.length;

                    var notNumbers = [] ;
                    var notFilled = []    
                    
                    for (i; i < length; i++) {
                        image = images[i];
                        if (!image.code || image.code.length === 0) {
                            notFilled.push(image.code)   
                            image.hasDanger = true
                        }
                        else if (!isNumeric(image.code)) {
                            notNumbers.push(image.code)
                            image.hasDanger = true
                        }
                    }

                    res.render(base.viewPath + 'tempImagesList.jade',{
                        id: profileId,
                        examNumber: examNumber,
                        docs: images,
                        profile: profile,
                        notFilled: notFilled,
                        notNumbers: notNumbers
                });

            });
        });
    }
};

function isNumeric(value) {
    return /^\d+$/.test(value);
}

exports.ResultScansController = ResultScansController;