var BaseController = require('./baseController').BaseController,
    translit = require('../modules/translit').translit,
    {google} = require('googleapis'),
    SCOPES = ['https://www.googleapis.com/auth/calendar'],
    redirect_uris = 'localhost:3000/',
    privatekey = require('./calendar-1b98abb101cf.json'),
    client = {
      'private_key': privatekey.private_key,
      'client_email': privatekey.client_email,
      'client_secret': 'Q--XCQCB3j1CaznN6THCtpQn',
      'client_id': '323312103424-shb5k2p6iaisk10eb8uelttn3jgivosh.apps.googleusercontent.com'
    };

ContactsController = function(mongoose, application) {
 
  var base  = new BaseController('Contacts', 'contacts', mongoose, application);

  base.remove = function(req, res) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      var name = doc.name;
      doc.remove(function() {
        application.menuController.generate(self.Collection);
        req.session.success = 'Польователь <strong>' + name.ru + '</strong> успешно удалён';
        res.redirect(self.path);
      });
    });
  };

  base.update = function(req, res) {
    var self = this;
    this.Collection.findByReq(req, res, function(doc){
      doc.name.ru = req.body['name.ru'];
      doc.name.by = req.body['name.by'];
      doc.name.en = req.body['name.en'];
      doc.occupation.ru = req.body['occupation.ru'];
      doc.occupation.by = req.body['occupation.by'];
      doc.occupation.en = req.body['occupation.en'];
      doc.phone = req.body['phone'];
      doc.email = req.body['email'];
      doc.place = req.body['place'];

      doc.order = req.body['order'] || 0;
      
      doc.save(function(err) {
        if (err) {
          req.session.error = 'Не получилось обновить контакт(( Возникли следующие ошибки: <p>' + err + '</p>';
          req.session.locals = {doc: doc};
          res.redirect(self.path + '/' + doc.id + '/edit');
        }
        else {
          req.session.success = 'Контакт <strong>' + doc.name.ru + '</strong> обновлен';
          res.redirect(self.path);
        }
      });
    });
  };

  base.save = function(req, res) {
    var self = this;
    var doc = new this.Collection(req.body);
    doc.save(function(err) {
      if (err) {
        req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
        req.session.locals = {doc: doc};
        res.redirect(self.path + '/create');
      } 
      else {
        req.session.success = 'Контакт <strong>' + doc.name.ru + '</strong> создан ' + doc.createdAt;
        res.redirect(self.path);
      }
    });
  };

  base.showList = function(req, res) {
      var self = this;
      this.getList(function(err, docs) {
          res.render(self.viewPath + 'show.jade', {docs: docs});
      });
  };

  base.getList = function(next) {
    var self = this;
    this.Collection.find().sort('order').exec(function(err, docs) {
        next(err, docs);
    });
  };

  base.getAppointmentForm = function(req, res){
    this.Collection.findByReq(req,res,function(doc){
      res.render('makeAppointment',{doc: doc});
    });
  }


  base.postAppointmentForm = function(req, res){
    this.Collection.findByReq(req,res,function(doc){
      var endDate = new Date(req.body.date + " " + req.body.time);
      endDate.setMinutes(endDate.getMinutes()+20);
      client.id = doc._id;
      client.startdate = (new Date(req.body.date + " " + req.body.time)).toISOString();
      client.enddate = endDate.toISOString();
      client.clientemail = req.body.email;
      client.discription = 'Встреча с ' + req.body.fullName + ', телефон: ' + req.body.phone;
      client.email = doc.email;
      //authorize(client, newEvent);
      newEvent(client);
      res.render('makeAppointment',{doc: doc});
    });
  }

  base.constructor = arguments.callee;

  return base;
};

exports.ContactsController = ContactsController;

function newEvent(client) {
  var event = {
    'creator': client.email,
    'summary': client.discription,
    'location':'Лицей БГУ',
    'description': client.discription,
    'start': {
      'dateTime': client.startdate,
      'timeZone': 'Europe/Minsk',
    },
    'end': {
      'dateTime': client.enddate,
      'timeZone': 'Europe/Minsk',
    },
    'visibility': 'public'
  }
  var oAuth2Client = new google.auth.OAuth2(
    client.client_id, client.client_secret, redirect_uris);
  var jwtClient = new google.auth.JWT(
    client.client_email,
    null,
    client.private_key,
    ['https://www.googleapis.com/auth/calendar']);
  jwtClient.authorize(function(err, tokens) {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log("Successfully connected!");
        var token = {
          'access_token': tokens.access_token,
          'scope': SCOPES[0],
          'token_type': tokens.token_type,
          'expiry_date': tokens.expiry_date
        };
        oAuth2Client.setCredentials(token);
        var calendar = google.calendar({
          version:'v3',
          auth: oAuth2Client});
        calendar.events.insert({
          auth: oAuth2Client,
          'calendarId': client.email,
          'resource': event
        }, function(err, event) {
          if (err) {
            console.log(err);
            return;
          }
          console.log(event.data.htmlLink);
        });
      }
  });
}