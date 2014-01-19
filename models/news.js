var NewsSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
    //  ObjectId = Schema.ObjectId;
  
  NewsSchema = new Schema({
   	'title': {type: String, index: true},
   	'body': String,
   	'createdAt': {type: Date, default: Date.now},
    'isCongratulation': Boolean,
  });
  
  NewsSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
  NewsSchema.statics.findByReq = function(req, res, next) {
    this.findOne({ _id: req.params.id}, function(err, doc) {
      if (!doc) {
        req.session.error = new Error('такой страницы не существует');
        res.redirect('404.html');
      } else {
        next(doc);
      }
    });
  };

  mongoose.model('News', NewsSchema);
  
  fn();
}

exports.define = define; 