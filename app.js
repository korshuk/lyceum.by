(function () {
    'use strict';
    var app,
        express = require('express'),
        mongoose = require('mongoose'),
        url = require('url'),
        fs = require('fs'),
        MongoStore = require('connect-mongo')(express),
        localization = require('./modules/localization').localization,
        NewsController = require('./controllers/news').NewsController,
        MediaController = require('./controllers/media').MediaController,
        CongratulationsController = require('./controllers/congratulations').CongratulationsController,
        UserController = require('./controllers/user').UserController,
        PageController = require('./controllers/page').PageController,
        MenuController = require('./controllers/menu').MenuController,
        ContactsController = require('./controllers/contacts').ContactsController,
        FileController = require('./controllers/file').FileController,
        db,
        // localization = require('./modules/localization').appLocalization,
        logfile = fs.createWriteStream('./logfile.log', {
            flags: 'a'
        });

    require('./modules/date.js');

    app = express();


    app.disable('x-powered-by');

    app.configure(function () {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.set('view options', {
            pretty: true
        });

        app.use(express.logger({
            stream: logfile
        }));

        app.use(express.bodyParser());
        app.use(express.methodOverride());

        app.use(express.static(__dirname + '/public'));

        app.set('db-uri', 'mongodb://localhost/lyceum');
        db = mongoose.connect(app.set('db-uri'));

        app.use('/admin', express.cookieParser('shhhh, very secret'));
        app.use('/admin', express.session({
            store: new MongoStore({
                url: 'mongodb://localhost/lyceum'
            }),
            secret: 'secret secret'
        }));
    });

    app.configure('development', function () {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    });

    app.configure('production', function () {
        app.use(express.errorHandler());
    });

    app.use(function (req, res, next) {
        res.locals.fullUrl = req.protocol + '://' + req.host + req.path;
        next();
    });

    app.use('/admin', function (req, res, next) {
        var err = req.session.error,
            msg = req.session.success;
        delete req.session.error;
        delete req.session.success;
        res.locals.logged = 'not logged';
        res.locals.message = '';
        if (err) {
            res.locals.message = '<div class="alert alert-danger">' + err + '</div>';
        }
        if (msg) {
            res.locals.message = '<div class="alert alert-success">' + msg + '</div>';
        }
        if (req.session.user) {
            res.locals.logged = 'logged';
        }
        next();
    });

    app.param('lang', function (req, res, next, lang) {
        var regex = new RegExp(/^(ru|by|en)$/);
        if (regex.test(lang)) {
            next();
        } else {
            next('route');
        }
    });

    app.fileController = new FileController(app);

    app.newsController = new NewsController(mongoose);
    app.mediaController = new MediaController(mongoose);
    app.congratulationsController = new CongratulationsController(mongoose);
    app.contactsController = new ContactsController(mongoose, app);

    require('./routes/frontRoutes')(app);

    app.menuController = new MenuController(app);
    app.userController = new UserController(mongoose);
    app.pageController = new PageController(mongoose, app);

    require('./routes/adminRoutes')(app);

    function extend(dest, from) {
        var props = Object.getOwnPropertyNames(from);
        props.forEach(function (name) {
            dest[name] = from[name];
        });
        return dest;
    }

    app.superCash = {};

    app.helpers = {
        setMenu: require('./controllers/menu').menuHelper,
        // setNewsMenu: require('./controllers/menu').menuNewsHelper,
        setLang: require('./modules/localization').loclizationHelper
    };

    app.sendPage = function (req, res, doc, viewPath) {
        var self = this,
            renderData = {};
        console.log('sendPage', req.appContentType);

        renderData = extend(renderData, self.helpers.setLang(req, res));
        renderData = extend(renderData, self.helpers.setMenu(req, res));

        if (req.appContentType === 'index') {
            renderData = extend(renderData, doc);
        } else {
            renderData.doc = doc;
        }
        renderData.path = req.path;
        self.render(viewPath,
            renderData,
            function (err, html) {
                self.superCash[req.originalUrl] = {
                    html: html,
                    updatedAt: doc.updatedAt
                };
                res.status(200).send(html);
            });
    };


    setTimeout(function () {
        app.use(function (req, res) {
            console.log('app.js 112');
            localization(req, res, function () {
                res.status(404).render('404.jade');
            });
        });
        if (!module.parent) {
            var port = process.argv[process.argv.length - 1];
            app.listen(port);
            console.log('started');
        }
    }, 5000);
}());