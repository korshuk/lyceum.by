var ProfilesSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ProfilesSchema = new Schema({
    	'name': String,
        'code': String,
        'subcode': String,
    	'firstExamName': String,
    	'firstExamDate': Date,
        'firstExamAppelationDate': Date,
    	'firstExamPlace': String,
        'firstExamUploaded': Boolean,
        'firstExamNoStats': Boolean,
    	'secondExamName': String,
    	'secondExamDate': Date,
        'secondExamAppelationDate': Date,
    	'secondExamPlace': String,
        'secondExamUploaded': Boolean,
        'totalExamUploaded': Boolean,
        'firstIsFirst': Boolean,
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
        'olimp': Number
    });

    mongoose.model('Profiles', ProfilesSchema);
    fn();
}

exports.define = define;