function define(mongoose, fn) {
    var Schema = mongoose.Schema,

        SubjectSchema = new Schema({
            'name': String,
            'date': Date,
            'startTime': String,
            'appelationDate': Date,
            'place': {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Places',
            },
            'uploaded': Boolean,
            'noStats': Boolean,
            'examKey': String,
        });

    SubjectSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    SubjectSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };

    SubjectSchema.statics.findSubjectsForExamNumber = function(examNum, next) {
        var self = this;
        this.find().exec(function(err, subjects) {
            var examDates = self.getExamDatesArray(subjects);
            var examDate = examDates[examNum];
            next(subjects.filter(function(subject){
                var date = new Date(subject.date)
                return date.getTime() === examDate
            }))
        })
    }

    SubjectSchema.statics.getExamDatesArray = function (subjects) {
        var examDates = [];
        var doc;
        var date;
        for (var i = 0; i < subjects.length; i++) {
            doc = subjects[i];
            date = new Date(doc.date);
            date = date.getTime();
            if (examDates.indexOf(date) < 0) {
                examDates.push(date);
            }
        }

        examDates = examDates.sort();

        return examDates;
    };

    SubjectSchema.statics.fillExamsArray = function (doc, examDates) {
        var exams = [];
        var date;
        var newExam;
        
        for (var j = 0; j < examDates.length; j++) {
            newExam = {};
            date = new Date(doc.date);
            date = date.getTime();

            if (examDates.indexOf(date) === j) {
                newExam = JSON.parse(JSON.stringify(doc));
            }
            exams.push(newExam);
        }

        return exams
    };


    mongoose.model('Subject', SubjectSchema);
    fn();
}

exports.define = define;