function define(mongoose, fn) {
    var Schema = mongoose.Schema,

        PlacesSchema = new Schema({
            'code': String,
            'name': String,
            'address': String,
            'audience': [{
                'name': String,
                'count': {
                    type: Number,
                    default: 0
                },
                'bel': Boolean,
                'max': Number
            }],
            'createdAt': {
                type: Date,
                default: Date.now
            }
        });

    PlacesSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    PlacesSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };
    mongoose.model('Places', PlacesSchema);
    fn();
}

exports.define = define;