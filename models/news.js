require('../modules/date.js');

function define(mongoose, fn) {
    var Schema = mongoose.Schema,
        //  ObjectId = Schema.ObjectId;

        NewsSchema = new Schema({
            'name': {
                'ru': {
                    type: String,
                    index: true
                },
                'en': {
                    type: String,
                    index: true
                },
                'by': {
                    type: String,
                    index: true
                }
            },
            'teaser': {
                'ru.data': {
                    type: Array,
                    required: true
                },
                'en.data': {
                    type: Array
                }, //, required: true}},
                'by.data': {
                    type: Array
                } //, required: true}},
            },
            'body': {
                'ru.data': {
                    type: Array
                },
                'en.data': {
                    type: Array
                }, //, required: true}},
                'by.data': {
                    type: Array
                } //, required: true}},
            },
            'image': {
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
            'newsType': {
                type: String
            },
            'isMain': String,
            'pathAlias': {
                type: String
            },
            'parentpage': String,
            'type': {
                'ru': String,
                'by': String,
                'en': String
            }

        });

    NewsSchema.virtual('id').get(function () {
        return this._id.toHexString();
    });

    NewsSchema.virtual('isNews').get(function () {
        return true;
    });

    NewsSchema.statics.findByReq = function (req, res, next) {
        var query;
        if (req.params.newsType) {
            query = {
                pathAlias: req.params.w
            };
        } else {
            query = {
                _id: req.params.id
            };
        }
        this.findOne(query, function (err, doc) {
            if (!doc) {
                res.redirect('404.html');
            } else {
                res.locals.breadcrumbs = {
                    name: {
                        ru: doc.createdAt.format('dd.MM.yyyy hh:mm'),
                        en: doc.createdAt.format('dd.MM.yyyy hh:mm'),
                        by: doc.createdAt.format('dd.MM.yyyy hh:mm')
                    }
                };
                next(doc);
            }
        });
    };

    mongoose.model('News', NewsSchema);

    fn();
}

exports.define = define;