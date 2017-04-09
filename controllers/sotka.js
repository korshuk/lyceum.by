var BaseController = require('./baseController').BaseController,
    translit = require('../modules/translit').translit;

SotkaController = function(mongoose, application) {
 
  var base  = new BaseController('Sotka', 'sotka', mongoose, application);

  setTimeout(calculate, 10 * 60 * 1000);

  function calculate() {
      application.profileController.Collection.find().exec(function (err, profiles) {
          profiles.forEach(function(profile) {
              application.pupilsController.Collection.find({profile: profile._id, status: 'approved'}).exec(function (err, pupils) {
                application.pupilsController.Collection.find({profile: profile._id, status: 'approved', passOlymp: true}).exec(function (err, pupilsOlymp) {
                    profile.olymp = pupilsOlymp.length;
                    profile.countArray.push({
                        count: pupils.length,
                        date: new Date()
                    });
                    profile.save(function (err, doc) {});
                });
              });
          });
      });
      setTimeout(calculate, 10 * 60 * 60 * 1000);
  }

  base.calculateStats = function (req, res) {
      application.profileController.Collection.find().exec(function (err, profiles) {
          profiles.forEach(function(profile) {
              application.pupilsController.Collection.find({profile: profile._id, status: 'approved'}).exec(function (err, pupils) {
                  application.pupilsController.Collection.find({profile: profile._id, status: 'approved', passOlymp: true}).exec(function (err, pupilsOlymp) {
                      profile.olymp = pupilsOlymp.length;
                      profile.countArray.push({
                          count: pupils.length,
                          date: new Date()
                      });
                      profile.save(function (err, doc) {});
                  });
              });
          });
      });
      res.redirect('/admin/settings');
  };

  base.restList = function (req, res) {
      var self = this;

      application.profileController.Collection.find().sort('order').exec(function(err, docs) {
            if (err) {
                res.send(err);
            }
            res.json(docs);
        });
  };
  
  base.addProfile = function (req, res) {
      var self = this;
      var doc = new self.Collection(req.body);
      doc.save(function(err, result) {
            if (err) {
                res.send(err);
            }
            else {
                base.restList(req, res);
            }
        });
  };
  
  base.removeProfile = function (req, res) {
    var self = this;
       self.Collection.findOne({ '_id': req.params.id }, function(err, doc) {
            if (err) {
                res.send(err);
            }
            else {
                doc.remove(function() {
                    base.restList(req, res);
                });
            }
        });
  };
  
  base.updateProfile = function (req, res) {
     var self = this;
     self.Collection.findOne({ '_id': req.params.id }, function(err, doc) {
            if (err) {
                res.send(err);
            }
            else {
                doc.ammount = req.body.ammount;
                doc.order = req.body.order || 0;
                doc.olymp = req.body.olymp || 0;
                doc.save(function(err, result) {
                    if (err) {
                        res.send(err);
                    }
                    else {
                        base.restList(req, res);
                    }
                });
            }
        }); 
  };
  
  base.constructor = arguments.callee;

  return base;
};

exports.SotkaController = SotkaController;