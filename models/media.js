var MediaSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
    //  ObjectId = Schema.ObjectId;
  
  MediaSchema = new Schema({
   	'name':{
      'ru': {type: String, index: true, required: true},
      'en': {type: String, index: true},
      'by': {type: String, index: true},
    }, 
   	'body': {
      'ru': {type: String, required: true},
      'en': {type: String},
      'by': {type: String},
    },
    'image' : {type: String, required: true},
    'link' : {type: String, required: true},

   	'createdAt': {type: Date, default: Date.now},
    'updatedAt': {type: Date, default: Date.now},
  });
  
  MediaSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
  MediaSchema.statics.findByReq = function(req, res, next) {
    var query;
    if (req.params.newsType) {
      query = { pathAlias: req.params.w};
    }
    else {
      query = { _id: req.params.id}; 
    }
    this.findOne(query, function(err, doc) {
        if (!doc) {
          req.session.error = new Error('такой страницы не существует');
          res.redirect('404.html');
        } else {
          next(doc);
        }
    });
  };

  mongoose.model('Media', MediaSchema);
  
  fn();
}

exports.define = define; 