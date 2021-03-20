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
            'absentDocumentsDate': Date,
            'reservedDayDate': Date,
            'totalResultsDate': Date,
            'endDocumentsDate': Date,
            'helloMessage': String,
            'anketaLink': String,
            'rulesLink': String,
            'rulesHTML': String,
            'rulesClassPoint': String,
            'rulesOlympPassPoint': String,
            'rulesOlympPoint': String,
            'rulesHalfPassPoint': String,
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
            'smsAPISecretCode': String,
            'showExamSeats1': Boolean,
            'showExamSeats2': Boolean,
            'agreement': String,
            'registrationVideoLink': String,
            'appelationFormLink': String,
            's3AccessKeyId': String,
            's3SecretAccessKey': String,
            's3Hostname': String,
            'reCaptchaSite': String,
            'reCaptchaSecret': String,
            'corsUrls': String,
            'logRocket': String
        });

    mongoose.model('Settings', SettingsSchema);
    fn();
}

exports.define = define;