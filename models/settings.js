var SettingsSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    SettingsSchema = new Schema({
    	'showPupilCabinet': Boolean
    });

    mongoose.model('Settings', SettingsSchema);
    fn();
}

exports.define = define;