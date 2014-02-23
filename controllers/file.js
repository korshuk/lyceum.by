var     fs = require('fs');

var isUnixHiddenPath = function (path) {
    return (/(^|.\/)\.+[^\/\.]/g).test(path);
};

FileController = function() {
	this.viewPath = 'file/';
	this.path = 'admin/files';	
};

FileController.prototype.list = function(req, res) {
	var self = this;
	var files = [];
	fs.readdir('./public/files', function(err, data){
		for (var i = 0; i < data.length; i++) {
			if (!isUnixHiddenPath(data[i])) {
				if(fs.statSync(data[i]).isFile()) {
					files.push(data[i]);
				}
			};
		};
		res.render(self.viewPath + 'list.jade', {docs: files});
	});
};

FileController.prototype.remove = function(req, res) {
  	var self = this;
  	var filename = req.params.name;
	fs.unlink('./public/files/' + filename, function (err) {
	  if (err) throw err;
	  req.session.success = 'Файл <strong>' + filename + '</strong> удален';
	  res.redirect(self.path);
	});
};

FileController.prototype.upload = function(req, res) {
  	var self = this;
  	if (req.files.fileupload.name) {
	  	var filename = req.files.fileupload.name;

	  	var is = fs.createReadStream(req.files.fileupload.path);
		var os = fs.createWriteStream('./public/files/' + filename);

		is.pipe(os);
		is.on('end',function() {
		    fs.unlinkSync(req.files.fileupload.path);
		    req.session.success = 'Файл <strong>' + filename + '</strong> загружен';

	  		res.redirect(self.path);
		});
	}
	else {
		res.redirect(self.path);
	}

};
exports.FileController = FileController;