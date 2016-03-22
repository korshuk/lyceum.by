var ExamSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ExamSchema = new Schema({
        'data': {
            type: Array
        },
        'passport' : {
            type: String,
            index: true,
            required: true
        },
        'message': String
    });

    ExamSchema.virtual('id').get(function () {
        return this._id.toHexString();
    });

    ExamSchema.statics.findByReq = function (req, res, next) {
        var that = this;
        var parentpage;
        this.findOne({
            _id: req.params.id
        }, function (err, doc) {
            if (!doc) {} else {
                next(doc);
            }
        });
    };

    mongoose.model('Exam', ExamSchema);
    fn();
}

exports.define = define;