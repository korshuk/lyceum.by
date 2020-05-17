var ResultScanSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ResultScanSchema = new Schema({
        'filename' : String,
        'profile': {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profiles'
        },
        'examNum': Number,
        'code': String,
        'text': String,
        created: {
            type: Date,
            default: Date.now
        },
    });

    ResultScanSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такого скана не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };
    
    mongoose.model('ResultScan', ResultScanSchema);
    fn();
}

exports.define = define;