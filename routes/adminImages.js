var     fs = require('fs'),
    	gm = require('gm')


module.exports = function(app) {
	app.post('/images/upload', function(req, res) {
	  var desktopPath = '/images/desktop/' + req.files.attachment.file.name;
	  var mobilePath = '/images/mobile/' + req.files.attachment.file.name;
	  var dwidth;
	  var mwidth;
	  var imageType;
	  
	  
	  gm(req.files.attachment.file.path).size(function (err, size) {
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

	      gm(req.files.attachment.file.path).resize(dwidth).write('./public' + desktopPath, function(err) {
	        if (!err) {
	          gm(req.files.attachment.file.path).resize(mwidth).write('./public' + mobilePath, function(err) {
	            if (!err) {
	              res.send({
	                file: {
	                  url: desktopPath,
	                  dUrl: desktopPath,
	                  mUrl: mobilePath,
	                  imageType: imageType
	                }
	              });
	              fs.unlink(req.files.attachment.file.path, function (err) {
	                if (err) console.log(err);
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

	app.post('/images/mediaupload', function(req, res) {
	  var desktopPath = '/images/media/' + req.files.attachment.file.name;
	  var width = 300;
	  var height = 200;
	  var imageType = 'wide';

	  gm(req.files.attachment.file.path).size(function (err, size) {
	    if (!err) {
	      	if (size.width > size.height) {
	        	manipulationForWide();
	      	}
	      	else {
	        	manipulationForTall();
	      	}

	      	function manipulationForWide() {
	      		gm(req.files.attachment.file.path)
	      			.resize(width)
	      			.write('./public' + desktopPath, function(err) {
	        			afterManipulation(err);
	    			});
	      	};

	      	function manipulationForTall() {
	      		gm(req.files.attachment.file.path)
	      			.crop(size.width, height * size.width / 300 , 0, size.height/2 - size.width / 3 )
	      			.resize(width)
	      			.write('./public' + desktopPath, function(err) {
	        			afterManipulation(err);
	    			});
	      	};

	      	function afterManipulation(err) {
	      		if (!err) {
	            	res.send({
	                	file: {
	                  		url: desktopPath,
	                  		dUrl: desktopPath,
	                  		mUrl: desktopPath,
	                  		imageType: imageType
	                	}
	              	});
	              	fs.unlink(req.files.attachment.file.path, function (err) {
	                	if (err) console.log(err);
	              	});
	            }
	            else console.log(err);
	      	};



	    }
	    else console.log(err);
	  });
	});
}