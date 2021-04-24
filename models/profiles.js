var FIELDS_TO_BE_VISIBLE = [
    '_id',
    'name',
    'code',
    'order',
    'belLang',
    'selectVariant',
    'exam1',
    'exam2',
    'olympExams',
].join(' ');

function define(mongoose, fn) {
    var Schema = mongoose.Schema,
        ProfilesSchema;

    ProfilesSchema = new Schema(
        {
            name: String,
            code: String,
            subcode: String,
            examPlace: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Places',
            },
            exam1: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject',
            },
            exam2: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject',
            },
            firstExamName: String,
            firstExamDate: Date,
            firstExamStartTime: String,
            firstExamAppelationDate: Date,
            firstExamPlace: String,
            firstExamUploaded: Boolean,
            firstExamNoStats: Boolean,
            secondExamName: String,
            secondExamDate: Date,
            secondExamStartTime: String,
            secondExamAppelationDate: Date,
            secondExamPlace: String,
            secondExamUploaded: Boolean,
            totalExamUploaded: Boolean,
            firstIsFirst: {
                type: Boolean,
                default: true,
            },
            guidePage: String,
            olympExams: [String],
            minF: Number,
            maxF: Number,
            passF: Number,
            minS: Number,
            maxS: Number,
            passS: Number,
            minT: Number,
            maxT: Number,
            passT: Number,
            halfpass: Number,
            halfDelta: Number,
            halfPupils: Number,
            ammount: Number,
            count: Number,
            countArray: Array,
            olymp: Number,
            order: Number,
            belLang: Boolean,
            firstUploaded: Boolean,
            secondUploaded: Boolean,
            totalUploaded: Boolean,
            examKey1: String,
            examKey2: String,
            selectVariant: [
                {
                    profiles: [
                        {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'Profiles',
                        },
                    ],
                },
            ],
        },
        { usePushEach: true }
    );

    ProfilesSchema.virtual('id').get(function () {
        return this._id.toHexString();
    });

    ProfilesSchema.statics.findByReq = function (req, res, next) {
        this.findOne({ _id: req.params.id })
            .populate('selectVariant.profiles')
            .exec(function (err, doc) {
                if (!doc) {
                    req.session.error = new Error(
                        'такой страницы не существует'
                    );
                    res.redirect('404.html');
                } else {
                    next(err, doc);
                }
            });
    };

    ProfilesSchema.statics.findAllForAjax = function (req, res, next) {
        this.find({}, FIELDS_TO_BE_VISIBLE)
            .populate('selectVariant.profiles', FIELDS_TO_BE_VISIBLE)
            .populate('exam1')
            .populate('exam2')
            .sort('order')
            .exec(function (err, docs) {
                if (docs.length > 0) {
                    next(docs);
                } else {
                    req.session.error = new Error(
                        'такой страницы не существует'
                    );
                    res.redirect('404.html');
                }
            });
    };

    ProfilesSchema.statics.getExamDatesArray = function (profiles) {
        var examDates = [];
        var doc;
        var date;
        for (var i = 0; i < profiles.length; i++) {
            doc = profiles[i];
            date = new Date(doc.exam1.date);
            date = date.getTime();

            if (examDates.indexOf(date) < 0) {
                examDates.push(date);
            }
            var date = new Date(doc.exam2.date);
            date = date.getTime();
            if (examDates.indexOf(date) < 0) {
                examDates.push(date);
            }
        }

        examDates = examDates.sort();

        return examDates;
    };

    ProfilesSchema.statics.fillExamsArray = function (doc, examDates) {
        var exams = [];
        var date;
        var newExam;
        
        for (var j = 0; j < examDates.length; j++) {
            newExam = {};
            date = new Date(doc.exam1.date);
            date = date.getTime();

            if (examDates.indexOf(date) === j) {
                newExam = doc.exam1;
            }
            date = new Date(doc.exam2.date);
            date = date.getTime();
            
            if (examDates.indexOf(date) === j) {
                newExam = doc.exam2;
            }
            exams.push(newExam);
        }

        return exams
    };

    mongoose.model('Profiles', ProfilesSchema);
    fn();
}

exports.define = define;
