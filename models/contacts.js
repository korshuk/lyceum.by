var ContactsSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
    //  ObjectId = Schema.ObjectId;
  
  ContactsSchema = new Schema({
   	'name': {
      'ru': {type: String, index: true},
      'by': {type: String, index: true},
      'en': {type: String, index: true},
    },
    'occupation': {
      'ru': {type: String, index: true},
      'by': {type: String, index: true},
      'en': {type: String, index: true},
    },
   	'place': Number,
    'phone': Number,
    'order': Number,
    'email': {type: String},
    'client_secret': {type: String},
    'client_id': {type: String},
    'redirect_uris': {type: String},
    'createdAt': {type: Date, default: Date.now}
  });
  
  ContactsSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
  ContactsSchema.statics.findByReq = function(req, res, next) {
    this.findOne({ _id: req.params.id}, function(err, doc) {
      if (!doc) {
        req.session.error = new Error('такой страницы не существует');
        res.redirect('404.html');
      } else {
        next(doc);
      }
    });
  };
    
  mongoose.model('Contacts', ContactsSchema);
  
  fn();
}

exports.define = define; 