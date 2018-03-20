var SettingsSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    SettingsSchema = new Schema({
    	'showPupilCabinet': Boolean,
        'showStats': Boolean,
        'clientAppName': String,
        'clientAppSecret': String,
        'registrationEndDate': Date,
        'confirmationEndDate': Date,
        'rulesLink': String,
        'rulesHTML': String,
        'email1': String,
        'email1Pass': String,
        'email2': String,
        'email2Pass': String,
        'email3': String,
        'email3Pass': String,
        'email4': String,
        'email4Pass': String,
        'superPassword': String,
        'reSiteKey': String,
        'smsAPIKey': String,
        'smsAPILogin': String,
        'smsAPIName': String,
        'smsAPISecretCode': String
    });

    mongoose.model('Settings', SettingsSchema);
    fn();
}

exports.define = define;