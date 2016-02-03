var ExamSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ExamSchema = new Schema({
       /* 'name': {
            type: String,
            index: true,
            required: true
        },*/
        'data': {
            type: Array
        },
      /*  'timestamp': {
            type: Date,
            index: true,
            required: false
        },*/
        'passport' : {
            type: String,
            index: true,
            required: true
        },
        /*'result': {
            type: String,
            index: true,
            required: true
        },
        'num': {
            type: String,
            index: true,
            required: true
        },
        'status': {
            type: String,
            index: true,
        }*/
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