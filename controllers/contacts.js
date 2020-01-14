var BaseController = require('./baseController').BaseController,
    translit = require('../modules/translit').translit,
    fs = require('fs'),
    readline = require('readline'),
    {google} = require('googleapis'),
    SCOPES = ['https://www.googleapis.com/auth/calendar'],
    redirect_uris = 'localhost:3000/',
    privatekey = require('./calendar-1b98abb101cf.json');

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
      doc.client_id = req.body['client_id'];
      doc.client_secret = req.body['client_secret'];

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
        if (doc.token != '') upload.single('token');
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
      var client = {
        'id': doc._id,
        'startdate': new Date(req.body.date + " " + req.body.time),
        'enddate': endDate,
        'clientemail': req.body.email,
        'discription': 'Встреча с ' + req.body.fullName + ', телефон: ' + req.body.phone,

        'email': doc.email,
        'client_secret': doc.client_secret,
        'client_id': doc.client_id
      }
      //authorize(client, newEvent);
      newEvent(client);
      res.render('makeAppointment',{doc: doc});
    });
  }

  base.constructor = arguments.callee;

  return base;
};

exports.ContactsController = ContactsController;

// function authorize(client, callback) {
//   var oAuth2Client = new google.auth.OAuth2(
//     client.client_id, client.client_secret, redirect_uris);
//   var TOKEN_PATH = client.id+'.json';
//   fs.readFile(TOKEN_PATH, (err, token) => {
//     if (err) return getAccessToken(oAuth2Client, callback, client);
//     oAuth2Client.setCredentials(JSON.parse(token));
//     callback(oAuth2Client, client);
//   });

// }
// function getAccessToken(oAuth2Client, callback, client) {
//   var authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//   });
//   console.log('Authorize this app by visiting this url:', authUrl);
//   var rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   rl.question('Enter the code from that page here: ', (code) => {
//     rl.close();
//     oAuth2Client.getToken(code, (err, token) => {
//       if (err) return console.error('Error retrieving access token', err);
//       oAuth2Client.setCredentials(token);
//       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//         if (err) return console.error(err);
//         console.log('Token stored to', TOKEN_PATH);
//       });
//       callback(oAuth2Client, client);
//     });
//   });
// }
function newEvent(/*auth,*/ client) {
  var event = {
    'summary': client.discription,
    'description': client.discription,
    'start': {
      'dateTime': client.startdate
    },
    'end': {
      'dateTime': client.enddate
    },
    'attendees':[
      {'email': client.clientemail},
      {'email': client.email}
    ]
  }
  var oAuth2Client = new google.auth.OAuth2(
    client.client_id, client.client_secret, redirect_uris);
  var jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
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
        // console.log(oAuth2Client);
        calendar.events.insert({
          auth: oAuth2Client,
          'calendarId': 'primary',
          'resource': event
        }, function(err) {
          if (err) console.log(err)
          else console.log('Event created');
        });
      }
  });
}