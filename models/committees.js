function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    CommitteesSchema = new Schema({
        'subject': {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        },
    	'head': String,
        'staff': String
            
    });

    CommitteesSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    CommitteesSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };
    mongoose.model('Committees', CommitteesSchema);
    fn();
}

exports.define = define;