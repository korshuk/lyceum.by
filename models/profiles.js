function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ProfilesSchema = new Schema({
    	'name': String,
        'code': String,
        'subcode': String,
        'examPlace': {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Places'
        },
    	'firstExamName': String,
        'firstExamDate': Date,
        'firstExamStartTime': String,
        'firstExamAppelationDate': Date,
    	'firstExamPlace': String,
        'firstExamUploaded': Boolean,
        'firstExamNoStats': Boolean,
    	'secondExamName': String,
        'secondExamDate': Date,
        'secondExamStartTime': String,
        'secondExamAppelationDate': Date,
    	'secondExamPlace': String,
        'secondExamUploaded': Boolean,
        'totalExamUploaded': Boolean,
        'firstIsFirst': {
    	    type: Boolean,
            default: true
        },
        'guidePage': String,
        'olympExams': [String],
        'minF': Number,
        'maxF': Number,
    	'passF': Number,
        'minS': Number,
        'maxS': Number,
        'passS': Number,
        'minT': Number,
        'maxT': Number,
        'passT': Number,
    	'halfpass': Number,
        'halfDelta': Number,
        'halfPupils': Number,
        'ammount': Number,
        'count': Number,
        'countArray': Array,
        'olymp': Number,
        'order': Number,
        'belLang': Boolean,
        'firstUploaded': Boolean,
        'secondUploaded': Boolean,
        'totalUploaded': Boolean
    }, { usePushEach: true });

    ProfilesSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    ProfilesSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };
    mongoose.model('Profiles', ProfilesSchema);
    fn();
}

exports.define = define;