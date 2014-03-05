var CongratulationsSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
    //  ObjectId = Schema.ObjectId;
  
  CongratulationsSchema = new Schema({
   	'name':{
      'ru': {type: String, index: true, required: true},
      'en': {type: String, index: true},
      'by': {type: String, index: true},
    }, 
    'teaser': {
      'ru.data': {type: Array, required: true},
      'en.data': {type: Array},//, required: true}},
      'by.data': {type: Array},//, required: true}},
    },
    'body': {
      'ru.data': {type: Array},
      'en.data': {type: Array},//, required: true}},
      'by.data': {type: Array},//, required: true}},
    },
    'image' : {type: String},
   	'createdAt': {type: Date, default: Date.now},
    'updatedAt': {type: Date, default: Date.now},
    'newsType': {type: String},
    'pathAlias': {type: String},
    'type': {
      'ru': String,
      'by': String,
      'en': String,
    }
  });
  
  CongratulationsSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
  CongratulationsSchema.statics.findByReq = function(req, res, next) {
    var query;
    console.log('!@!@@!!!@!@@!@!@!');
    if (req.params.congratulationsType) {
      query = { pathAlias: req.params.w};
    }
    else {
      query = { _id: req.params.id}; 
    }
    console.log(query);
    this.findOne(query, function(err, doc) {
        if (!doc) {
          //req.session.error = new Error('такой страницы не существует');
          res.redirect('404.html');
        } else {
          res.locals.breadcrumbs = {
            name: {
              ru: doc.name.ru,
              en: doc.name.en,
              by: doc.name.by
            }
          };
          next(doc);
        }
    });
  };

  mongoose.model('Congratulations', CongratulationsSchema);
  
  fn();
}

exports.define = define; 