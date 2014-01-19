var  model = require('../models/user');
    //hash = require('../pass').hash;

UserController = function(mongoose) {
	var self = this;
  this.viewPath = 'users/';
  this.path = 'admin/users';
  this.crypto = require('crypto');
  this.len = 128;
  this.iterations = 12000;
	model.define(mongoose, function() {
	  self.Users = mongoose.model('User');
	});
};

UserController.prototype.hash = function (pwd, salt, fn) {
  var self = this;
  if (3 == arguments.length) {
    self.crypto.pbkdf2(pwd, salt, self.iterations, self.len, function(err, hash){
      fn(err, (new Buffer(hash, 'binary')).toString('base64'));
    });
  } else {
    fn = salt;
    self.crypto.randomBytes(self.len, function(err, salt){
      if (err) return fn(err);
      salt = salt.toString('base64');
      self.crypto.pbkdf2(pwd, salt, self.iterations, self.len, function(err, hash){
        if (err) return fn(err);
        fn(null, salt, (new Buffer(hash, 'binary')).toString('base64'));
      });
    });
  }
};

UserController.prototype.authenticate = function(name, pass, req, res) {
  var self = this;
  this.Users.findOne({name: name}, function(err, user) {
    if (!user) return self.authResult(new Error('cannot find user'), req, res);
    self.hash(pass, user.salt, function(err, hash){
      console.log('start');
      if (err) return self.authResult(err, req, res);
      if (hash == user.hash) return self.authResult(null, req, res, user);
      self.authResult(new Error('invalid password'), req, res);
    });
  });
};

UserController.prototype.authResult = function(err, req, res, user){
  if (user) {
    req.session.regenerate(function(){
      req.session.user = user;
      req.session.success = 'Authenticated as ' + user.name + ' click to <a href="/logout">logout</a>. You may now access <a href="/news/create">/news create</a>.';
      res.redirect('back');
    });
  } else {
    req.session.error = 'Authentication failed, please check your '
      + ' username and password.';
    res.redirect('admin');
  }
};

UserController.prototype.logout = function(req, res){
  req.session.destroy(function(){
    res.redirect('/admin');
  });
};

UserController.prototype.list = function(req, res) {
	var self = this;
  this.Users.find().sort('-createdAt').exec(function(err, users) {
    	users = users.map(function(u) {
      		return { name: u.name, id: u._id, createdAt: u.createdAt, hash: u.hash };
    	}); 
    	res.render(self.viewPath + 'list.jade', {users: users});
  	});
};

UserController.prototype.show = function(req, res, next) {
	var self = this;
  this.Users.findOne({ _id: req.params.id}, function(err, users) {
     	if (!users) return next(new NotFound('Document not found'));
	    switch (req.params.format) {
    	  	case 'json':
        		res.send(users.toObject());
      		break;
	    	case 'html':
    	    	res.send(users.toObject());
        		//res.send(markdown.toHTML(news.data));
      		break;
		    default:
	    	    res.render(self.viewPath + 'show.jade', {u: users});
	    }
  	});
};

UserController.prototype.create = function(req, res) {
  	var self = this;
  	res.render(self.viewPath + 'new.jade', {u: new self.Users()});
};

UserController.prototype.edit = function(req, res, next) {
	var self = this;
  this.Users.findOne({ _id: req.params.id}, function(err, users) {
    	if (!users) return next(new NotFound('Document not found'));
   		res.render(self.viewPath + 'edit.jade', {u: users});
	});
};

UserController.prototype.update = function(req, res, next) {
	var self = this;
  this.Users.findOne({ _id: req.params.id}, function(err, users) {
	    if (!users) return next(new NotFound('Document not found'));
	    users.name = req.body.name;
	    users.sult = req.body.sult;
	    users.save(function(err) {
	      switch (req.params.format) {
	        case 'json':
	          res.send(users.toObject());
	        break;
	        default:
	       //   req.flash('info', 'Document updated');
	          res.redirect(self.path);
	      }
	    });
  	});
};

UserController.prototype.save = function(req, res) {
  var self = this;
  var u = new this.Users();
  u.name = req.body.name;
  this.hash(req.body.pass, function(err, salt, hash){
    if (err) throw err;
    u.salt = salt;
    u.hash = hash;
    u.save(function() {
      switch (req.params.format) {
        case 'json':
          var data = u.toObject();
          // TODO: Backbone requires 'id', but can I alias it?
          data.id = data._id;
          res.send(data);
        break;
        default:
          req.session.success = 'Пользователь <strong>' + u.name + '</strong> создан';
          res.redirect(self.path);
      }
    });
  });
};

UserController.prototype.remove = function(req, res, next) {
  var self = this;
  this.Users.findOne({_id: req.params.id}, function(err, u) {
    if (!u) return next(new NotFound('Document not found'));
    var name = u.name;
    u.remove(function() {
      switch (req.params.format) {
        case 'json':
          res.send('true');
        break;
        default:
          req.session.success = 'Пользователь <strong>' + name + '</strong> успешно удалён';
          res.redirect(self.path);
      } 
    });
  });
};

exports.UserController = UserController;
