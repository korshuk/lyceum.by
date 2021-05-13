function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    StatsSchema = new Schema({
        result: [{
            profile: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Profiles'
            },
            countTotal: Number,
            countTotalBeta: Number,
            countOlymp: Number
        }],
        examsMap: {
            type: Object,
            default: {}
        },
        date: {
            type: Date,
            default: Date.now
        },
        pupilsCount: {
            type: Number,
        }
        
    });

    mongoose.model('Sotka', StatsSchema);
    fn();
}

var mongoose = require('mongoose')

var SubjectStatsSchema = new mongoose.Schema({
        result: [{
            subject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject'
            },
            profileNames: [String],
            results: [Number],
            subjectAmmount: Number,
            subjectOlymp: Number,
            countTotal: Number,
            min: Number,
            max: Number,
            pass: Number,
            absentCount: Number,
            presentCount: Number
        }],
        date: {
            type: Date,
            default: Date.now
        }
        
});
exports.define = define;
exports.SubjectStatsModel = mongoose.model('SubjectStatsSchema', SubjectStatsSchema)