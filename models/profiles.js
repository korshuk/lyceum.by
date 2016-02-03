var ProfilesSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ProfilesSchema = new Schema({
    	'name': String,
    	'firstExamName': String,
    	'firstExamDate': Date,
    	'firstExamPlace': String,
    	'secondExamName': String,
    	'secondExamDate': Date,
    	'secondExamPlace': String,
    	'pass': Number,
    	'halfpass': Number
    });

    mongoose.model('Profiles', ProfilesSchema);
    fn();
}

exports.define = define;