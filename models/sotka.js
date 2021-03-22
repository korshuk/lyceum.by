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
        date: {
            type: Date,
            default: Date.now
        },
        
    });

    mongoose.model('Sotka', StatsSchema);
    fn();
}

exports.define = define;