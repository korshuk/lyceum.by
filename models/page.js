var PageSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,
        //  ObjectId = Schema.ObjectId;
        PageSchema = new Schema({
            'name': {
                'ru': {
                    type: String,
                    index: true,
                    required: true
                },
                'en': {
                    type: String,
                    index: true
                }, //, required: true},
                'by': {
                    type: String,
                    index: true
                }, //, required: true},
            },
            'body': {
                'ru.data': {
                    type: Array,
                    required: true
                },
                'en.data': {
                    type: Array
                }, //, required: true}},
                'by.data': {
                    type: Array
                }, //, required: true}},
            },
            'description': {
                'ru': {
                    type: String
                },
                'en': {
                    type: String
                },
                'by': {
                    type: String
                },
            },
            'keywords': {
                'ru': {
                    type: String
                },
                'en': {
                    type: String
                },
                'by': {
                    type: String
                },
            },
            'pathAlias': {
                type: String,
                required: true
            },
            'parentpage': String,
            'order': Number,
            'createdBy': {
                type: String
            },
            'createdAt': {
                type: Date,
                default: Date.now
            },
            'updatedAt': {
                type: Date,
                default: Date.now
            },
            'type': {
                'ru': String,
                'by': String,
                'en': String,
            }
        });
    PageSchema.virtual('id').get(function () {
        return this._id.toHexString();
    });

    PageSchema.statics.findByReq = function (req, res, next) {
        var that = this;
        var parentpage;
        this.findOne({
            _id: req.params.id
        }, function (err, doc) {
            if (!doc) {} else {
                next(doc);
            }
        });
    };

    mongoose.model('Page', PageSchema);
    fn();
}

exports.define = define;