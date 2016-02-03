var BaseController = require('./baseController').BaseController;
var Parse = require('csv-parse');
var fs = require('fs'),
	mongoose = require('mongoose');


ExamsController = function(mongoose) {
	var self = this;
	var vid = 0;

	this.examDatasModel = require('../models/examDatas');
    this.examDatasModel.define(mongoose, function () {
        self.examDatasCollection = mongoose.model('ExamDatas');
    });


    this.profilesModel = require('../models/profiles');
    this.profilesModel.define(mongoose, function () {
        self.profilesCollection = mongoose.model('Profiles');
    });

  	var base  = new BaseController('Exam', 'exams', mongoose);

	function onNewRecord(records, number, req, res){
		var record = records[number];
		//TODO: translate
		
		base.Collection.findOne({passport: record.passport}, function (err, doc) {
			if (err) {
				console.log('find error');
				return;
			}
			if(!doc) {
				doc = new base.Collection();
				doc.passport = record.passport;
				doc.data = [];
			}
			
			doc.data.push({
				vid: vid,
				num: records[number].num
			});
			

			doc.save(function (err, d) {
				console.log('doc save', doc.status);
				if (err) {
					console.log('doc save err', err);
					//TODO error handle
				}
				else {
					number = number + 1;

					if (records.length > number) {
						console.log(number, records[number].num);
						onNewRecord(records, number, req, res);
					}
					else {
						done(req, res);
					}
				}

			})
		});
	}

	function onError(error){
	    console.log('error', error)
	}

	function done(req, res){
		var date = new Date();
		data = new self.examDatasCollection();
		data.date = date;
		data.vid = vid;
		data.save(function(err, data) {
			if (err) {
					console.log('data version save err', err);
					//TODO error handle
				}
			else {
				res.redirect('/admin/exams');
			}
		});
	}
  
	function parseCSVFile(req, res){
		
		var records = [];
        var source = fs.createReadStream(req.files.csvTable.path);

        var parser = Parse({
            delimiter: ',', 
            columns: true
        });

        parser.on("readable", function(){
            var record;
            while (record = parser.read()) {
            	records.push(record);
            }
        });

        parser.on("error", function(error){
            onError(error)
        });

        parser.on("end", function(){
        	self.examDatasCollection.find().sort('-date').limit(1).exec(function (err, doc) {
        		console.log(doc, vid);
        		if (doc.length > 0) {
        			console.log('if (doc)', vid);
        			vid = doc[0].vid + 1;
        			console.log('if (doc)', vid);
        		}
        		if (records.length) {
	        		onNewRecord(records, 0, req, res);
	        	}
        	})        	
        });

        source.pipe(parser);
    }

    function versionDelete (req, res, next) {
    	console.log(req.docs[req.number].data.length);
    	for (var i = req.docs[req.number].data.length - 1; i >= 0; i--) {
    		console.log(122, req.docs[req.number].data[i].vid);
    		if (req.docs[req.number].data[i].vid == req.vid) {
    			console.log(124, req.vid);

    			req.docs[req.number].data.splice(i,1);
    			
    			console.log(req.docs[req.number].data);
    			
    			req.docs[req.number].save(function (err) {
    				console.log('errrrrr', arguments);
    			})
    			console.log(req.vid, req.docs[req.number]);
    		}
    	};
    	req.number = req.number + 1;
    	if (req.number < req.docs.length) {
    		versionDelete (req, res, next)
    	}
    	else {
    		if (next) {
    			next(req, res);
    		}
    	}
    }

    function versionDeleteCallback (req, res){
    	req.examData.remove(function () {
    		res.redirect('/admin/exams');
    	});
	}

	base.list = function (req, res) {
	    res.render(base.viewPath + 'list.jade');
    };

    base.versionList = function(req, res) {
		self.examDatasCollection.find().exec(function (err, docs) {
			console.log(err);
			res.json(docs);
		});
    };

    base.deleteversion = function(req, res) {
    	self.examDatasCollection.findOne({'_id': req.params.id}, function (err, doc) {
    		if (err) {
				console.log('deleteversion find err', err);
					//TODO error handle 
			}
			else {
				console.log(169, doc.vid);
				req.vid = doc.vid;
				req.examData = doc;
				base.Collection.find().exec(function (err, docs) {
					req.docs = docs;
					req.number = 0;
					versionDelete(req, res, versionDeleteCallback);					
				})
	    		
    		}
    	})
    	
    }

	base.resultsUpload = function(req, res) {
		var filePath = req.files.csvTable.path;
		parseCSVFile(req, res);
	};
//477 25 31
	base.listRest = function (req, res) {
        base.Collection.find().exec(function (err, docs) {
     		if (err) {
     			res.send(err);
     		}
     		var response = [];
     		for (var i = docs.length - 1; i >= 0; i--) {
     			docs[i].data = docs[i].data[docs[i].data.length - 1];
     			response.push(docs[i]);
     		};
     		
     		res.json(docs);
        });
    };

    base.getExam = function (req, res) {
		base.Collection.findOne({'_id': req.params.id}, function (err, doc) {
    		if (err) {
				res.send(err);
					//TODO error handle
			}
			else {
				res.json(doc);	    		
    		}
    	})
    };

    base.updateExam = function (req, res) {
		base.Collection.findOne({'_id': req.params.id}, function (err, doc) {
			if (err) {
				res.send(err);
			}
			else {
				doc.passport = req.body.passport;
				doc.data = req.body.data;
				doc.save(function (err, result) {
					console.log(result);
					console.log(doc.data[doc.data.length - 1]);
					if (err) {
						res.send(err);
					}
					else {
						res.json(doc);	    
					}
				});
			}
		});
    };

  	base.constructor = arguments.callee;

  	return base;
};

exports.ExamsController = ExamsController;