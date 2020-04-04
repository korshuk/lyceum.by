function define(mongoose, fn) {
    var Schema = mongoose.Schema,

        PupilMessagesSchema = new Schema({
            'name': {
                type: String,
                required: true
            },
            'type': {
                type: Number,
                default: 0,
            },
            'order': {
                type: Number,
                default: 0
            },
            'messageTemplate': { 
                'blocks': {
                    type: Array,
                    required: true
                }
            }
        });

    PupilMessagesSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    PupilMessagesSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };


    mongoose.model('PupilMessage', PupilMessagesSchema);
    fn();
}

exports.define = define;