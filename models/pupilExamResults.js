var mongoose = require('mongoose');

var PupilExamResultModelSchema = new mongoose.Schema({
    value: {
        type: Number,
        default: 0
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject' // 'Profiles'Subject
    },
    result: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamResults'
    },
    pupil: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pupil'
    }
})

var PupilExamSumModelSchema = new mongoose.Schema({
    value: {
        type: Number,
        default: 0
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profiles'
    },
    pupil: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pupil'
    }
})

var PupilExamResultModel = mongoose.model('PupilExamResult', PupilExamResultModelSchema);

var PupilExamSumModel = mongoose.model('PupilExamSum', PupilExamSumModelSchema);

exports.PupilExamResultModel = PupilExamResultModel;
exports.PupilExamSumModel = PupilExamSumModel;