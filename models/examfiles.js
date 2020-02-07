var ExamFilesSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
  
  ExamFilesSchema = new Schema({
     'name': String,
     'url': String,
     'numberexzam': Number,
     'resultId':{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamResults'
     },
     'profileId': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profiles'
    },
  });
  
  ExamFilesSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
  ExamFilesSchema.statics.findByReq = function(req, res, next) {
    this.findOne({ _id: req.params.id}, function(err, doc) {
      if (!doc) {
        req.session.error = new Error('такой страницы не существует');
        res.redirect('404.html');
      } else {
        next(doc);
      }
    });
  };
    
  mongoose.model('ExamFiles', ExamFilesSchema);
  
  fn();
}

exports.define = define; 