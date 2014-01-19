var express = require('express'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    gm = require('gm'),
    winston = require('winston'),

  
 //   localization = require('./controllers/localization').localization,
    NewsController = require('./controllers/news').NewsController,
    UserController = require('./controllers/user').UserController,
    PageController = require('./controllers/page').PageController,
    db;

require('./modules/date.js');

var app = express();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {pretty: true});

  app.use(express.logger());
  
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(express.directory(__dirname + '/public'));
  app.use(express.static(__dirname + '/public'));

  app.set('db-uri', 'mongodb://localhost/nodeblog');
  db = mongoose.connect(app.set('db-uri'));

  app.use(express.cookieParser('shhhh, very secret'));
  app.use(express.session());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.logged = 'not logged';
  res.locals.message = '';
  if (err) res.locals.message = '<div class="alert alert-danger">' + err + '</div>';
  if (msg) res.locals.message = '<div class="alert alert-success">' + msg + '</div>';
  if (req.session.user) res.locals.logged = 'logged';
  next();
});

//var localization = new LocalizationController();

var newsController = new NewsController(mongoose);
app.userController = new UserController(mongoose);
app.pageController = new PageController(mongoose, app);

function menu(req, res, next){
  res.menu.html = pageController.menuHTML;
  next();
}
winston.log('info', 'Hello distributed log files!');
  winston.info('Hello again distributed logs');

app.get('/404.html', function(req, res){
   res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
});
/*
app.get('/:lang/index.html', localization, function(req, res){
  res.render('index.jade');
});*/
/*
app.get('/:w.html', localization, function(req, res){
  pageController.show(req, res);
});

app.get('/:lang/:w.html', localization, function(req, res){
  pageController.show(req, res);
});
*/

app.get('/news', function(req, res) {newsController.list(req, res);});
app.get('/news/create', function(req, res) {newsController.create(req, res);});
app.get('/news/:id', function(req, res) {newsController.show(req, res);});
app.get('/news/:id/edit', function(req, res) {newsController.edit(req, res);});
app.post('/news', function(req, res) {newsController.save(req, res);});
app.put('/news/:id', function(req, res) {newsController.update(req, res);});



require('./routes/adminLogin')(app);
require('./routes/adminUsers')(app);
require('./routes/adminPages')(app);




app.post('/images/upload', function(req, res) {
  console.log('image upload');
  console.log(req.body.attachment);
  var serverPath = '/images/' + req.files.attachment.file.name; //req.files.image.name;

  var desktopPath = '/images/desktop/' + req.files.attachment.file.name;
  var mobilePath = '/images/mobile/' + req.files.attachment.file.name;
  var dwidth;
  var mwidth;
  var imageType;
  console.log(req.files.attachment.file);
  var image = gm(req.files.attachment.file.path);

  image.size(function (err, size) {
    if (!err) {

      if (size.width > size.height) {
        dwidth = 620;
        mwidth = 300;
        imageType = 'wide';
      }
      else {
        dwidth = 300;
        mwidth = 100;
        imageType = 'narrow';
      }

      image.resize(dwidth).write('./public' + desktopPath, function(err) {
        if (!err) {
          image.resize(mwidth).write('./public' + mobilePath, function(err) {
            if (!err) {
              res.send({
                file: {
                  url: desktopPath,
                  dUrl: desktopPath,
                  mUrl: mobilePath,
                  imageType: imageType
                }
              });
            }
            else console.log(err);
            });
        }
        else console.log(err);
      });

    }
    else console.log(err);
  });
});
/*
app.get('*', function(req, res) {
  res.redirect('404.html');
});
*/
if (!module.parent) {
  app.listen(3000);
  console.log('started');
}
