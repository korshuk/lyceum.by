function define(mongoose, fn) {
    var Schema = mongoose.Schema,
        //  ObjectId = Schema.ObjectId;

        EmailsSchema = new Schema({
            'error': {type: String},
            'messageId': {type: String},
            'response': {type: String},
            'from': {type: String},
            'to': {type: String},
            'subject': {type: String},
            'html': {type: String},
            'createdAt': {type: Date, default: Date.now}
        });

    EmailsSchema.virtual('id').get(function() {
        return this._id.toHexString();
    });

    mongoose.model('Emails', EmailsSchema);

    fn();
}

exports.define = define;