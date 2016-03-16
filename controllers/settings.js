var BaseController = require('./baseController').BaseController;

SettingsController = function(mongoose) {

  var base  = new BaseController('Settings', 'settings', mongoose);
  
  base.list = function (req, res) {
    var self = this;
    this.Collection.find().sort('-createdAt').exec(function (err, docs) {
        res.render(self.viewPath + 'list.jade', {
            docs: docs[0]
        });
    });
  };
  
  base.save = function (req, res) {
      var self = this;
      var doc;
      this.Collection.find().sort('-createdAt').exec(function (err, docs) {
          if (docs.length > 0) {
              doc = docs[0];
          } else {
              doc = new base.Collection();
          }
          doc.showPupilCabinet = req.body.showPupilCabinet == 'on' ? true : false;
          console.log(doc, req.body.showPupilCabinet);
          doc.save(function (err, d) {
            res.redirect(self.path);
          });
      });      
  };
  
  base.constructor = arguments.callee;

  return base;
};



exports.SettingsController = SettingsController;