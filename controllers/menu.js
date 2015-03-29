var model = require('../models/menu'),
    localization = require('../modules/localization').localization,
    sortBY = require('../modules/sort').sortBy,
    pathArray = {},
    MainMenu = [],
    subMenusArray = {},
    breadcrumbsArray = {},
    app;

var getSubMenu = function (id) {
    return subMenusArray[id];
};

var getBreadcrumbs = function (id) {
    return breadcrumbsArray[id];
};

var menuHelper = function (req, res, next) {
    var id;
    if (pathArray[req.path]) {
        id = pathArray[req.path].id;
        req.params.id = id;
        res.locals.subMenu = getSubMenu(id);
        res.locals.breadcrumbs = getBreadcrumbs(id);
        res.locals.MainMenu = MainMenu;
        res.locals.activepage = res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].name;
        next();
    } else {
        console.log('menu.js 30');
        res.status(404).render('404.jade');
    }
};

var appReqHelper = function (req, res) {
    console.log('appReqHelper');
    switch (req.appContentType) {
    case 'page':
        if (pathArray[req.path]) {
            req.params.id = pathArray[req.path].id;
        } else {
            console.log('menu.js 40');
            localization(req, res, function () {
                res.status(404).render('404.jade');
            });
        }
    case 'news':
        break;
    case 'congratulations':
        break;
    }
};

var appMenuHelper = function (req, res) {
    console.log('appMenuHelper', req.params);
    var id = req.params.id,
        renderData = {};
    renderData.MainMenu = MainMenu;
    console.log(req.appContentType);
    switch (req.appContentType) {
    case 'page':
        if (pathArray[req.path]) {
            renderData.subMenu = getSubMenu(id);
            renderData.breadcrumbs = getBreadcrumbs(id);
            renderData.activepage = renderData.breadcrumbs[renderData.breadcrumbs.length - 1].name;
            return renderData;
        } else {
            console.log('menu.js 59');
            res.status(404).render('404.jade');
        }
        break;
    case 'news':
        renderData.metatags = {
            title: 'Новости',
            keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Новости',
            description: 'Новости Лицея БГУ'
        }
        return renderData;
        break;
    case 'congratulations':
        renderData.metatags = {
            title: 'Поздравления',
            keywords: 'Лицей БГУ, Лицей Белорусского государственного университета, Новости',
            description: 'Успехи и победы лицеистов'
        }
        return renderData;
        break;
    case 'index':
        return renderData;
        break;
    }

};

/*var appNewsMenuHelper = function (req, res, next) {
    var renderData = {};
    renderData.MainMenu = MainMenu;
    return renderData;
};*/

var newsMenuHelper = function (req, res, next) {
    var id;
    if (newsPathArray[req.path]) {
        id = newsPathArray[req.path].id;
        req.params.id = id;
        res.locals.subMenu = [];
        //TODO news type
        res.locals.breadcrumbs = [{
            name: {
                en: 'cvxmx m',
                by: 'fvfvf',
                ru: 'sdfsdf'
            },
            path: '/sdfsdf.html'
      }];
        res.locals.MainMenu = MainMenu;
        res.locals.activepage = res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].name;
        next();
    } else {
        console.log('menu.js 96');
        res.status(404).render('404.jade');
    }
};

var MenuController = function (app) {

    this.JSON = {
        children: []
    };

    this.routes = [];

    this.List = [];

    this.clear = function () {
        var self = this,
            i;
        this.JSON = {
            children: []
        };
        for (i = 0; i < self.routes.length; i++) {
            for (k in app.routes.get) {
                if (app.routes.get[k].path === self.routes[i] || app.routes.get[k].path === '/:lang' + self.routes[i]) {
                    app.routes.get.splice(k, 1);
                }
            }
        }
        this.routes = [];
        this.List = [];
        pathArray = {};
        subMenusArray = {};
    };

    this.generate = function (collection) {
        var self = this,
            i;
        self.clear();
        collection.find().sort('createdAt').exec(function (err, docs) {
            for (i = 0; i < docs.length; i++) {
                self.saveItem(docs[i]);
            }

            self.resort();
            self.generateMainMenu();
            self.generateRouts();

            self.listTree(self.JSON);
        });
    };

    this.saveItem = function (doc) {
        var self = this,
            menuItem = new model.MenuItem({
                id: doc.id,
                name: doc.name,
                pathAlias: doc.pathAlias,
                order: doc.order
            });
        doc.parentpage === '' ? self.JSON.children.push(menuItem) : self.saveTree(self.JSON, doc.parentpage, menuItem);
    };

    this.saveTree = function (m, parent, item) {
        var i;
        for (i = 0; i < m.children.length; i++) {
            if (m.children[i].id === parent) {
                m.children[i].children.push(item);
                break;
            }
            this.saveTree(m.children[i], parent, item);
        }
    };

    this.resort = function () {
        var self = this,
            newJSON = {
                children: []
            };
        this.itemsTree(self.JSON, newJSON);
        this.JSON = newJSON;
    };

    this.listTree = function (m) {
        var item,
            i;
        if (m.children.length !== 0) {
            m.children = sortBy(m.children, ['order']);
            for (i = 0; i < m.children.length; i++) {
                this.List.push(m.children[i]);
                this.listTree(m.children[i]);
            }
        }
    };

    this.itemsTree = function (m, n) {
        var item,
            i;
        if (m.children.length !== 0) {
            m.children = sortBy(m.children, ['order']);
            for (i = 0; i < m.children.length; i++) {
                item = new model.MenuItem({
                    id: m.children[i].id,
                    name: m.children[i].name,
                    pathAlias: m.children[i].pathAlias,
                    order: m.children[i].order
                });
                n.children.push(item);
                this.itemsTree(m.children[i], n.children[i]);
            }
        }
    };

    this.generate_xml_sitemap = function () {
        // this is the source of the URLs on your site, in this case we use a simple array, actually it could come from the database
        // var urls = ['about.html', 'javascript.html', 'css.html', 'html5.html'];
        // the root of your website - the protocol and the domain name with a trailing slash
        var root_path = 'http://www.lyceum.by',
            priority = 0.8,
            freq = 'monthly',
            xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            i;
        for (i in pathArray) {
            xml += '<url>';
            xml += '<loc>' + root_path + i + '</loc>';
            xml += '<changefreq>' + freq + '</changefreq>';
            xml += '<priority>' + priority + '</priority>';
            xml += '</url>';
            i++;
        }
        xml += '</urlset>';
        return xml;
    };

    this.generateRouts = function () {
        var self = this;
        self.map(self.JSON, '/');
        self.setRouts();
    };

    this.setRouts = function () {
        var self = this,
            i;
        console.log('set');
        app.routes.get.splice(app.routes.get.length - 1, 1);
        for (i = self.routes.length - 1; i >= 0; i--) {
            console.log(self.routes[i]);
            app.get('/:lang' + self.routes[i], function (req, res) {
                console.log('12');
                req.appContentType = 'page';
                app.pageController.show(req, res);
            });
            app.get(self.routes[i], function (req, res) {
                console.log('13');
                req.appContentType = 'page';
                app.pageController.show(req, res);
            });
        }
        app.get('/sitemap.xml', function (req, res) {
            var sitemap = self.generate_xml_sitemap(); // get the dynamically generated XML sitemap
            res.header('Content-Type', 'text/xml');
            res.send(sitemap);
        });
    };

    this.map = function (obj, path) {
        var self = this,
            i;
        if (obj.pathAlias) {
            path = path + obj.pathAlias;
            self.addPathToPathArray(path, obj);
            path = path + '/';
        }
        if (obj.children.length !== 0) {
            self.routes.push(path + ':w.html');
            for (i = 0; i < obj.children.length; i++) {
                self.map(obj.children[i], path);
            }
        }
    };

    this.addPathToPathArray = function (path, obj) {
        pathArray[path + '.html'] = {
            id: obj.id
        };
        pathArray['/ru' + path + '.html'] = {
            id: obj.id
        };
        pathArray['/en' + path + '.html'] = {
            id: obj.id
        };
        pathArray['/by' + path + '.html'] = {
            id: obj.id
        };


        subMenusArray[obj.id] = this.generateSubMenu(obj.id);
        obj['path'] = path + '.html';

        breadcrumbsArray[obj.id] = this.generateBreadcrumbs(obj);
    };

    this.generateMainMenu = function () {
        MainMenu = this.JSON.children;
    };

    this.getMainMenu = function () {
        return MainMenu;
    };

    this.generateBreadcrumbs = function (obj) {
        var that = this,
            array = [],
            flag = true;
        array.push({
            name: obj.name
        });

        var search = function (json, _obj) {
            var path;
            for (var i = 0; i < json.children.length; i++) {
                for (var j = 0; j < json.children[i].children.length; j++) {
                    if (json.children[i].children[j].id === _obj.id) {

                        for (var p in pathArray) {
                            if (pathArray[p].id === json.children[i].id) {
                                path = p;
                                break;
                            }
                        }
                        array.push({
                            name: json.children[i].name,
                            path: p
                        });
                        search(that.JSON, json.children[i]);
                        flag = false;
                    }
                }
                if (flag) {
                    search(json.children[i], _obj);
                }
            }
        }
        search(this.JSON, obj);
        return array;
    };

    this.generateSubMenu = function (id) {
        var array = [],
            flag = true;

        var search = function (json) {
            for (var i = 0; i < json.children.length; i++) {
                if (json.children[i].id === id) {
                    if (json.children[i].children.length) {
                        array = json.children[i].children;
                    } else {
                        for (var j = 0; j < MainMenu.length; j++) {
                            if (MainMenu[j].id === id) {
                                flag = false;
                            }
                        }
                        if (flag) {
                            array = json.children;
                        }
                    }
                    break;
                } else {
                    search(json.children[i]);
                }
            }
        }
        search(this.JSON);
        return array;
    };
};
exports.menuReqHelper = appReqHelper;
exports.menuHelper = appMenuHelper;
//exports.menuNewsHelper = appNewsMenuHelper;
exports.MenuController = MenuController;