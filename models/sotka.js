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

exports.define = define;