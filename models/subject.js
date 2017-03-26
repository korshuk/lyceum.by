function define(mongoose, fn) {
    var Schema = mongoose.Schema,

        SubjectSchema = new Schema({
            'name': String,
        });

    SubjectSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    SubjectSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };


    mongoose.model('Subject', SubjectSchema);
    fn();
}

exports.define = define;