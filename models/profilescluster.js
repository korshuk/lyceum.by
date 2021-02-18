function define(mongoose, fn) {
    var Schema = mongoose.Schema,
        ProfilesClusterSchema;
    
    ProfilesClusterSchema = new Schema({
        'name': String,
        'code': String,
        'profiles': [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profiles'
        }]
    })
    ProfilesClusterSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };
    mongoose.model('ProfilesCluster', ProfilesClusterSchema);
    fn();
}


exports.define = define;
