function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    SeedsSchema = new Schema({
        examNum: Number,
        examDate: Date,
        created: {
            type: Date,
            default: Date.now
        },
        generatedDate: {
            type: Date,
        },
        savedDate: {
            type: Date,
        },
        visible: {
            type: Boolean,
            default: false
        },
        visibleAuditorium: {
            type: Boolean,
            default: false
        }
        
    });

    mongoose.model('Seed', SeedsSchema);
    fn();
}

exports.define = define;