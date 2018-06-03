var crypto = require('crypto');
var mongoose = require('mongoose');

function define(mongoose, fn) {
    var PupilSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true
        },
        hashedPassword: {
            type: String,
            required: true
        },
        salt: {
            type: String,
            required: true
        },
        created: {
            type: Date,
            default: Date.now
        },
        status: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        confirmMailToken: String,
        examStatus: String,

        profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profiles'
        },
        place1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Places'
        },
        place2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Places'
        },
        audience1: String,
        audience2: String,
        needBel: Boolean,
        firstName: String,
        lastName: String,
        parentName: String,
        requestImg: String,
        diplomImg: String,
        phone: String,
        phoneCode: String,
        codeValid: Boolean,

        night: Boolean,
        distant: Boolean,
        requestImgNotApproved: Boolean,
        requestImgNoPhoto: Boolean,
        requestImgLowQuality: Boolean,
        requestImgStampError: Boolean,
        diplomImgNotApproved: Boolean,
        diplomExamName: String,

        passOlymp: Boolean,
        exam1: Number,
        exam2: Number,
        sum: Number,
        region: String,
        message: String,

        recommended: {
            type: Boolean,
            default: false
        },
    });

    PupilSchema.methods.encryptPassword = function (password) {
        return crypto
            .createHmac('sha1', this.salt)
            .update(password)
            .digest('hex');
    };

    PupilSchema.virtual('userId')
        .get(function () {
            return this.id;
        });

    PupilSchema.virtual('FIO')
        .get(function () {
            return [this.firstName, this.lastName, this.parentName].join(' ');
        });

    PupilSchema.virtual('password')
        .set(function (password) {
            this._plainPassword = password;
            this.salt = crypto.randomBytes(32).toString('base64');
            this.hashedPassword = this.encryptPassword(password);
            this.save();
        })
        .get(function () {
            return this._plainPassword;
        });


    PupilSchema.methods.checkPassword = function (password) {
        return this.encryptPassword(password) === this.hashedPassword;
    };

    PupilSchema.statics.findByReq = function(req, res, next) {
        this.findOne({ _id: req.params.id}, function(err, doc) {
            if (!doc) {
                req.session.error = new Error('такой страницы не существует');
                res.redirect('404.html');
            } else {
                next(doc);
            }
        });
    };

    mongoose.model('Pupil', PupilSchema);
    fn();
}

var HistoryModelSchema = new mongoose.Schema({
    created: {
        type: Date,
        default: Date.now
    },
    pupil: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pupil'
    },
    message: String
});

var HistoryModel = mongoose.model('HistoryModelSchema', HistoryModelSchema);

var ClientApp = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    clientId: {
        type: String,
        unique: true,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    }
});

var ClientAppModel = mongoose.model('ClientApp', ClientApp);

var AccessToken = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var AccessTokenModel = mongoose.model('AccessToken', AccessToken);

var RefreshToken = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var RefreshTokenModel = mongoose.model('RefreshToken', RefreshToken);


exports.define = define;

exports.ClientAppModel = ClientAppModel;
exports.AccessTokenModel = AccessTokenModel;
exports.RefreshTokenModel = RefreshTokenModel;
exports.HistoryModel = HistoryModel;