var crypto = require('crypto');
var mongoose = require('mongoose');
var async = require('async');

var PUPIL_FIELDS_TO_BE_VISIBLE = [
    '_id', 
    'email', 
    'firstName',
    'lastName',
    'parentName', 
    'status', 
    'dessaproveDate', 
    'profile', 
    'diplomProfile',
    'diplomExamName',
    'additionalProfiles',
    'isEnrolledToExams',
    //'place1', 
    //'place2', 
    // 'result1', 
    // 'result2',
    'region',
    'requestImg',
    'diplomImg',
    'night',
    'distant',
    'phone',
    'codeValid',
    'needBel',
    'message',
    'passOlymp',
    'requestImgNotApproved',
    'diplomImgNotApproved',
    'places_saved',
    'results'
    // 'examResults',
    // 'examSums'
].join(' ');

function define(mongoose, fn) {
    var PupilSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true
        },
        hashedPassword: {
            type: String,
            required: true
        },
        salt: {
            type: String,
            required: true
        },
        created: {
            type: Date,
            default: Date.now
        },
        dessaproveDate: {
            type: Date,
        },
        status: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        confirmMailToken: String,

        profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profiles'
        },
        diplomProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profiles'
        },
        additionalProfiles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profiles'
        }],
        places_generated: [{
            corps: String,
            audience: String,
            seedId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Seed'
            },
            place: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Places'
            },
            exam: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject'
            }
        }],
        places_saved: [{
            corps: String,
            audience: String,
            seedId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Seed'
            },
            place: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Places'
            },
            exam: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject'
            }
        }],
        results: [{
            exam: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject'
            },
            examStatus: String,
            result: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ExamResults'
            }
        }],
        needBel: Boolean,
        firstName: String,
        lastName: String,
        parentName: String,
        requestImg: String,
        diplomImg: String,
        phone: String,
        phoneCode: String,
        codeValid: Boolean,

        night: Boolean,
        distant: Boolean,
        requestImgNotApproved: Boolean,
        requestImgNoPhoto: Boolean,
        requestImgLowQuality: Boolean,
        requestImgStampError: Boolean,
        diplomImgNotApproved: Boolean,
        diplomExamName: String,

        passOlymp: Boolean,
        isEnrolledToExams: Boolean,
        exam1: Number,
        exam2: Number,
        sum: Number,
        region: String,
        message: String,
        agreement: {
            type: Boolean,
            default: false
        },
        recommended: {
            type: Boolean,
            default: false
        },
    });

    PupilSchema.methods.encryptPassword = function (password) {
        return crypto
            .createHmac('sha1', this.salt)
            .update(password)
            .digest('hex');
    };

    PupilSchema.virtual('userId')
        .get(function () {
            return this.id;
        });

    PupilSchema.virtual('FIO')
        .get(function () {
            return [this.firstName, this.lastName, this.parentName].join(' ');
        });

    PupilSchema.virtual('password')
        .set(function (password) {
            this._plainPassword = password;
            this.salt = crypto.randomBytes(32).toString('base64');
            this.hashedPassword = this.encryptPassword(password);
            this.save();
        })
        .get(function () {
            return this._plainPassword;
        });


    PupilSchema.methods.checkPassword = function (password) {
        return this.encryptPassword(password) === this.hashedPassword;
    };
    
    PupilSchema.statics.findOneForAjax = function(req, res, next) {
        this.findOne({_id: req.user.userId}, PUPIL_FIELDS_TO_BE_VISIBLE)
            .populate('profile')
            .populate('diplomProfile')
            .populate('place1')
            .populate('place2')
            .populate('result1')
            .populate('result2')
            .populate('selectVariant')
            .populate('places_saved.place')
            .populate('results.result')
            .exec(function(err, pupil) {
                next(err, pupil)
            })
    };
    
    PupilSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };

    PupilSchema.statics.findApprovedPupilsForProfile = function(profileId) {
        var query = this
            .find({status: 'approved'})
            .find({
                $or: [
                    { "profile": profileId }, 
                    { "diplomProfile": profileId, passOlymp: true },
                    { "additionalProfiles": { _id: profileId } }
                ]
            });

        return query
    };

    PupilSchema.statics.findPupilsForSubject = function(subjectId, next) {
        var self = this;
        this.find({status: 'approved'})
            .populate('profile')
            .populate('additionalProfiles')
            .exec(function(err, pupils){
                var exams;
                var pupil;
                var pupilsToSeed = []
                var subjectsIds = [subjectId]
                for (var i = 0; i < pupils.length; i++) {
                    pupil = pupils[i];
                    exams = self.getPupilExams(pupil)
                    if (!pupil.passOlymp || pupil.isEnrolledToExams) {
                        //console.log(exams)
                        for(var j = 0; j < exams.length; j++) {
                            if (subjectsIds.indexOf(exams[j]) > -1) {
                                pupilsToSeed.push({
                                    pupil: pupil,
                                    exam: exams[j]
                                })
                            }
                        }
                    }
                }
                next(pupilsToSeed)
            })
    };

    

    PupilSchema.statics.findApprovedOlympPupilsForProfile = function(profileId) {
        return this.find({diplomProfile: profileId, status: 'approved', passOlymp: true})
    };

    PupilSchema.statics.findByResultAsigned = function(resultId, examNumber, next) {
        var queryObj = {};
        queryObj['result' + examNumber] = resultId

        this.findOne(queryObj, next)
    } 

    PupilSchema.statics.calculateExamsCount = function(next) {
        var self = this;
        var examsMap = {};
        
        this.find({status: 'approved'})
            .populate('profile')
            .populate('additionalProfiles')
            .exec(function (err, pupils) {
                var i = 0;
                var pupilsLength = pupils.length;
                var pupil;
                var exams = [];
                for (i; i < pupilsLength; i++) {
                    pupil = pupils[i];
                    exams = self.getPupilExams(pupil);
                    
                    if (!pupil.passOlymp || pupil.isEnrolledToExams) {
                        for (var j = 0; j < exams.length; j++) {
                            if(examsMap[exams[j]] && examsMap[exams[j]] > 0) {
                                examsMap[exams[j]] += 1;
                            } else {
                                examsMap[exams[j]] = 1;
                            }   
                        }
                    }
                }
                next(examsMap)
            })
    } 

    PupilSchema.statics.getPupilExams = function(pupil) {
        var profiles = [];
        var exams = [];
        if (!pupil.passOlymp || pupil.isEnrolledToExams) {
            if (pupil.additionalProfiles && pupil.additionalProfiles.length > 0) {
                profiles = pupil.additionalProfiles
            } 

            profiles.push(pupil.profile)
            for (var j = 0; j < profiles.length; j++) {
                if (exams.indexOf('' + profiles[j].exam1) < 0) {
                    exams.push('' + profiles[j].exam1)
                }

                if (exams.indexOf('' + profiles[j].exam2) < 0) {
                    exams.push('' + profiles[j].exam2)
                }
            }
        }
        return exams
    }

    PupilSchema.statics.subjectSearch = function(req, res, next) {
        var self = this;
        var subjectId = req.params.subjectId;
        var query = this.find({"status": "approved"});
        
        generateQueryParams(req);

        if (req.queryParams.firstName) {
            query.find({"firstName": new RegExp(req.queryParams.firstName, 'i')});
        }
        if (req.queryParams.email) {
            query.find({"email": new RegExp(req.queryParams.email, 'i')});
        }

        query
            // .sort(req.queryParams.sortDirection + req.queryParams.sortField)
            .populate('diplomProfile')
            .populate('profile')
            .populate('additionalProfiles')
            .populate('results.exam')
            .populate('results.result')

        query.exec(function(err, pupils){
                var exams;
                var pupil;
                var result;
                var pupilsToSeed = []
                var subjectsIds = [subjectId]
                for (var i = 0; i < pupils.length; i++) {
                    pupil = pupils[i];
                    exams = self.getPupilExams(pupil)
                    if (!pupil.passOlymp || pupil.isEnrolledToExams) {
                        //console.log(exams)
                        for(var j = 0; j < exams.length; j++) {
                            if (subjectsIds.indexOf(exams[j]) > -1) {
                                pupilsToSeed.push({
                                    pupil: pupil,
                                    exam: exams[j]
                                })
                            }
                        }
                    }
                }
                for (var i = 0; i < pupilsToSeed.length; i++) {
                    pupil = pupilsToSeed[i].pupil;
                    pupilsToSeed[i].result = {
                        sum: 0
                    };
                    for (var j = 0; j < pupil.results.length; j++) {
                        
                        if (''+pupil.results[j].exam._id === ''+subjectId) {
                            pupilsToSeed[i].result = JSON.parse(JSON.stringify(pupil.results[j]))
                            pupilsToSeed[i].result.sum = 0;
                            if (pupilsToSeed[i].result.result) {
                                console.log(pupilsToSeed[i].result.result)
                                pupilsToSeed[i].result.sum = pupilsToSeed[i].result.result.Points;
                                if (pupilsToSeed[i].result.result.AdditionalPoints > 0) {
                                    pupilsToSeed[i].result.sum + pupilsToSeed[i].result.result.AdditionalPoints;
                                }
                            }
                        }
                    }
                }
                var sortParam = 1;
                if (req.queryParams.sortDirection === '-') {
                    sortParam = -1
                }
                var sortField = req.queryParams.sortField;
                var firstPart = sortField.split('.')[0];
                var lastPart = sortField.split('.')[1];
                if (firstPart && lastPart ) {
                    pupilsToSeed = pupilsToSeed.sort(function(a, b) {
                        if ( a[firstPart][lastPart] < b[firstPart][lastPart] ){
                            return -1 * sortParam;
                        }
                        if ( a[firstPart][lastPart] > b[firstPart][lastPart] ){
                            return sortParam;
                        }
                        return 0;
                        
                        
                    })
                }
                var count = pupilsToSeed.length;
                
                var pupilsToSend = [];
                var itemNum;
                var skip = req.queryParams.itemsPerPage * (req.queryParams.page - 1)
                for (var i = 0; i < req.queryParams.itemsPerPage; i++) {
                    itemNum = i + skip;
                    if (pupilsToSeed[itemNum]) {
                        pupilsToSend.push(pupilsToSeed[itemNum])
                    }
                    
                }
                next({
                    data: pupilsToSend,
                    count: count
                })
            })
    }
    

    PupilSchema.statics.simpleSearch = function(req, res, next) {
        var query = this.find();
        generateQueryParams(req);

        this.apiSearch(req, res, query, next);
    }
    
    PupilSchema.statics.duplicatesSearch = function(req, res, next) {
        var self = this;
        var group = {
            $group:
                {
                    _id: {firstName: "$firstName"},
                    uniqueIds: {$addToSet: "$_id"},
                    count: {$sum: 1}
                }
        };
        var match = {
            $match: {
                count: {"$gt": 1}
            }
        };
        var sort = {
            $sort: {
                count: -1
            }
        };
        
        generateQueryParams(req);

        this.aggregate([group, match, sort], onDuplicatesFound);

        function onDuplicatesFound(err, results) {
            var query;
            var uniqueIds = [];
    
            results.forEach(function (result) {
                result.uniqueIds.forEach(function (id) {
                    uniqueIds.push(id);
                })
            });
    
            query = self.find({_id: {$in: uniqueIds}});
    
            self.apiSearch(req, res, query, next);
        }

    }

    PupilSchema.statics.apiSearch = function (req, res, query, next) {
        var countQuery;
        if (req.queryParams.firstName) {
            query.find({"firstName": new RegExp(req.queryParams.firstName, 'i')});
        }
        if (req.queryParams.email) {
            query.find({"email": new RegExp(req.queryParams.email, 'i')});
        }
        if (req.queryParams.status) {
            query.find({"status": req.queryParams.status});
        }
        if (req.queryParams.profile) {
            // query.find({"profile": req.queryParams.profile});
            query.find({
                $or: [
                    { "diplomProfile": req.queryParams.profile},
                    { "profile": req.queryParams.profile }, 
                    { "additionalProfiles": req.queryParams.profile} //{ _id: req.queryParams.profile } }
                ]
            });
        }
        if (req.queryParams.examStatus) {
            if (req.queryParams.examStatus === '0') {
                query.find( {
                    $or: [
                        {"examStatus": null},
                        {"examStatus": req.queryParams.examStatus}
                    ]
                })
            } else {
                query.find({"examStatus": req.queryParams.examStatus});
            }
            
        }
        if (req.queryParams.recommended) {
            query.find({"recommended": req.queryParams.recommended});
        }
        if (req.queryParams.agreement) {
            query.find({"agreement": req.queryParams.agreement});
        }
        countQuery = query;

        query
            .sort(req.queryParams.sortDirection + req.queryParams.sortField)
            .skip(req.queryParams.itemsPerPage * (req.queryParams.page - 1))
            .limit(req.queryParams.itemsPerPage)
            .populate('diplomProfile')
            .populate('profile')
            .populate('additionalProfiles')
            .populate('results.exam')

        var firstQ = function (callback) {
            query
                .exec(function (err, data) {
                    queryExecFn(err, data, callback)
                });
        };

        var secondQ = function (callback) {
            countQuery
                .count()
                .exec(function (err, data) {
                    queryExecFn(err, data, callback)
                });
        };

        async.parallel([firstQ, secondQ], next);
    }

    mongoose.model('Pupil', PupilSchema);
    fn();

    
}

var HistoryModelSchema = new mongoose.Schema({
    created: {
        type: Date,
        default: Date.now
    },
    pupil: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pupil'
    },
    message: String
});

var HistoryModel = mongoose.model('HistoryModelSchema', HistoryModelSchema);

var ClientApp = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    clientId: {
        type: String,
        unique: true,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    }
});

var ClientAppModel = mongoose.model('ClientApp', ClientApp);

var AccessToken = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var AccessTokenModel = mongoose.model('AccessToken', AccessToken);

var RefreshToken = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var RefreshTokenModel = mongoose.model('RefreshToken', RefreshToken);


function generateQueryParams(req) {
    var sortObj = req.query.sort ? req.query.sort.split('-') : ['created', 'asc'];

    req.queryParams = {
        sortObj: sortObj,
        sortField: sortObj[0],
        sortDirection: sortObj[1] === 'asc' ? '' : '-',
        profile: req.query.profile,
        status: req.query.status,
        examStatus: req.query.examStatus,
        firstName: req.query.firstName,
        email: req.query.email,
        recommended: req.query.recommended,
        agreement: req.query.agreement,
        itemsPerPage: req.query.itemsPerPage || 100,
        page: req.query.page || 1
    };
}

function queryExecFn(err, data, callback) {
    if (err) {
        callback(err, null);
    }
    else {
        callback(null, data);
    }
}

exports.define = define;

exports.ClientAppModel = ClientAppModel;
exports.AccessTokenModel = AccessTokenModel;
exports.RefreshTokenModel = RefreshTokenModel;
exports.HistoryModel = HistoryModel;