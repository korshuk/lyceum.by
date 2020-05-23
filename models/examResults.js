function define(mongoose, fn) {
  var Schema = mongoose.Schema;
  var ExamFilesSchema;
  var ExamResultSchema;

  ExamResultSchema = new Schema({
    'examNumber': Number,
    'profile': {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profiles'
    },
    'image': {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamFiles'
    },
    'Student': String,
    'ID': Number,
    'GradeCam ID': String,
    'Class': String,
    'Version': String,
    'Missed': String,
    'Points': Number,
    'AdditionalPoints': Number,
    'Possible': Number,
    'Score': String,
    'Scanned': Date
  });

  ExamResultSchema.virtual('id').get(function () {
    return this._id.toHexString();
  });

  ExamResultSchema.statics.findByReq = function (req, res, next) {
    this.findOne({
      _id: req.params.id
    }, function (err, doc) {
      if (!doc) {
        req.session.error = new Error('такой страницы не существует');
        res.redirect('404.html');
      } else {
        next(doc);
      }
    });
  };

  ExamResultSchema.statics.findByGreatCamID = function (ID, examNumber, profileId, next) {
    this.findOne({
      ID: ID, 
      examNumber: examNumber,
      profileId: profileId
    }, next);
  };

  ExamResultSchema.statics.saveNewResult = function (record, profile, examNumber, next) {
    var result;
    record.examNumber = examNumber;
    record.profile = profile;

    result = new this(record);
    result.save(next);
  }

  ExamResultSchema.statics.updateResult = function (result, data, examNumber, profile, next) {
    result.examNumber = examNumber;
    result.profile = profile;
    result.Student = data.Student;
    result.ID = data.ID;
    result['GradeCam ID'] = data['GradeCam ID'];
    result.Class = data.Class;
    result.Version = data.Version;
    result.Missed = data.Missed;
    result.Points = data.Points;
    result.Possible = data.Possible;
    result.Score = data.Score;
    result.Scanned = data.Scanned;

    result.save(next);
  }

  ExamFilesSchema = new Schema({
    'name': String,
    'examNumber': Number,
    'profileId': {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profiles'
    },
    'ID': String,
    'isTemp': Boolean
  });

  ExamFilesSchema.virtual('id').get(function () {
    return this._id.toHexString();
  });

  ExamFilesSchema.statics.findByReq = function (req, res, next) {
    this.findOne({
      _id: req.params.id
    }, function (err, doc) {
      if (!doc) {
        req.session.error = new Error('такой страницы не существует');
        res.redirect('404.html');
      } else {
        next(doc);
      }
    });
  };


  mongoose.model('ExamResults', ExamResultSchema);
  mongoose.model('ExamFiles', ExamFilesSchema);
  fn();
}

exports.define = define;