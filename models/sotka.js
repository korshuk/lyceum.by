var ProfilesSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ProfilesSchema = new Schema({
    	'name': String,
        'halfPupils': Number,
        'ammount': Array,
        'places': Number,
        'order': Number,
        'olymp': Number
    });

    mongoose.model('Sotka', ProfilesSchema);
    fn();
}

exports.define = define;