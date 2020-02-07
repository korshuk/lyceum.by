var ExamResultSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
  
  ExamResultSchema = new Schema({
     'Student': String,
     'StudentId': String,
     'Missed': String,
     'Points': Number,
     'Possible': Number,
     'Score': String,
     'url': String,
     'numberexzam': Number,
     'profileId': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profiles'
      },
      'imageId':{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamFiles'
      },
  });
  
  ExamResultSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
   ExamResultSchema.statics.findByReq = function(req, res, next) {
    this.findOne({ _id: req.params.id}, function(err, doc) {
      if (!doc) {
        req.session.error = new Error('такой страницы не существует');
        res.redirect('404.html');
      } else {
        next(doc);
      }
    });
  };
    
  mongoose.model('ExamResults', ExamResultSchema);
  
  fn();
}

exports.define = define; 