var FIELDS_TO_BE_VISIBLE = [
    '_id', 
    'name', 
    'code',
    'order',
    'belLang', 
    'selectVariant'
].join(' ');

function define(mongoose, fn) {
    var Schema = mongoose.Schema,
        ProfilesSchema;

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
        'totalUploaded': Boolean,
        'examKey1': String,
        'examKey2': String,
        'selectVariant': [{
            profiles: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Profiles'
            }]
        }]
    }, { usePushEach: true });

    ProfilesSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    ProfilesSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id})
            .populate('selectVariant.profiles')
            .exec(function(err, doc) {
                if (!doc) {
                    req.session.error = new Error('такой страницы не существует');
                    res.redirect('404.html');
                } else {
                    next(err, doc);
                }
            })
    };
    
    ProfilesSchema.statics.findAllForAjax = function(req, res, next) {
        this.find({}, FIELDS_TO_BE_VISIBLE)
            .populate('selectVariant.profiles', FIELDS_TO_BE_VISIBLE)
            .sort('order')
            .exec(function(err, docs) {
                if (docs.length > 0) {
                    next(docs);
                } else {
                    req.session.error = new Error('такой страницы не существует');
                    res.redirect('404.html');
                }
            })
    };
    
    mongoose.model('Profiles', ProfilesSchema);
    fn();
}

exports.define = define;