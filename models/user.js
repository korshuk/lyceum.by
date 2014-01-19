var UserSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
    //  ObjectId = Schema.ObjectId;
  
  UserSchema = new Schema({
   	'name': {type: String, index: true},
   	'salt': String,
    'hash': String,
   	'createdAt': {type: Date, default: Date.now}
  });
  
  UserSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
  UserSchema.statics.findByReq = function(req, res, next) {
    this.findOne({ _id: req.params.id}, function(err, doc) {
      if (!doc) {
        req.session.error = new Error('такой страницы не существует');
        res.redirect('404.html');
      } else {
        next(doc);
      }
    });
  };
    
  mongoose.model('User', UserSchema);
  
  fn();
}

exports.define = define; 