var express = require('express'),
    mongoose = require('mongoose'),
    winston = require('winston'),
    url = require('url'),
    NewsController = require('./controllers/news').NewsController,
    MediaController = require('./controllers/media').MediaController,
    CongratulationsController = require('./controllers/congratulations').CongratulationsController,
    UserController = require('./controllers/user').UserController,
    PageController = require('./controllers/page').PageController,
    MenuController = require('./controllers/menu').MenuController,
    ContactsController = require('./controllers/contacts').ContactsController,
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
  
  //app.use(require('stylus').middleware({ src: __dirname + '/public' }));
 
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

app.newsController = new NewsController(mongoose);
app.mediaController = new MediaController(mongoose);
app.congratulationsController = new CongratulationsController(mongoose);
app.contactsController = new ContactsController(mongoose, app);

require('./routes/frontRoutes')(app);

app.menuController = new MenuController(app);
app.userController = new UserController(mongoose);
app.pageController = new PageController(mongoose, app);

require('./routes/adminRoutes')(app);

if (!module.parent) {
  app.listen(3000);
  console.log('started');
}
