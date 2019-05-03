var ReportSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ReportSchema = new Schema({
        'type' : Number,
        'profile': String,
        'subject': String,
        'date': Date,
        created: {
            type: Date,
            default: Date.now
        },
        'html':String,
    });

    mongoose.model('Report', ReportSchema);
    fn();
}

exports.define = define;