var express = require('express'),
	fs = require('fs'),
	gm = require('gm'),
	Jimp = require('jimp');


module.exports = function(app) {
	var router = express();

	router.get('/upload', function(req, res) {
		res.send({ asd: 123})
	})

	router.post('/mainImageUpload', mainImageUpload);
	router.put('/mainImageUpload', mainImageUpload);
	router.post('/upload', imageUpload);
	router.put('/upload', imageUpload);

	router.post('/mediaupload', mediaupload);
	router.put('/mediaupload', mediaupload);

	app.use('/admin/images', router);

	function mediaupload(req, res) {
		var desktopPath = '/images/media/' + req.files.fileupload.name;
		var width = 300;
		var height = 200;
		var imageType = 'wide';
		var reqFile = req.files.fileupload;

		new Jimp(reqFile.path, function(err, image) {
			if (err) throw err;

			fs.unlink(reqFile.path);
			
			if (image.bitmap.width > image.bitmap.height) {
				manipulationForWide();
			  }
			  else {
				manipulationForTall();
			}
			
			function manipulationForWide() {
				image
					.resize(width, Jimp.AUTO)
					.write('./public' + desktopPath, function(err) {
					  afterManipulation(err);
				  });
			};

			function manipulationForTall() {
				image
					.crop(0, image.bitmap.height/2 - image.bitmap.width / 3, image.bitmap.width, height * image.bitmap.width / 300)
					.resize(width, Jimp.AUTO)
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
			  }
			  else console.log(err);
			};

		});

		/*gm(req.files.attachment.file.path).size(function (err, size) {
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
		*/
	}

	function mainImageUpload(req, res) {
		var desktopPath = '/images/desktop/' + req.files.fileupload.name;
		var mobilePath = '/images/mobile/' + req.files.fileupload.name;
		var dwidth;
		var mwidth;
		var imageType;
		var reqFile = req.files.fileupload;

		new Jimp(reqFile.path, function(err, image) {
			if (err) throw err;

			fs.unlink(reqFile.path);
			
			if (image.bitmap.width > image.bitmap.height) {
				dwidth = 620;
				mwidth = 300;
				imageType = 'wide';
			}
			else {
				dwidth = 300;
				mwidth = 100;
				imageType = 'narrow';
			}
		  
			
			image
				.clone()
				.quality(100)
				.resize(dwidth, Jimp.AUTO)
				.write('./public' + desktopPath, function() {
					image
						.quality(100)
						.resize(mwidth, Jimp.AUTO)
						.write('./public' + mobilePath, function() {
							res.send({
								success: 1,
								file: {
								  url: desktopPath,
								  dUrl: desktopPath,
								  mUrl: mobilePath,
								  imageType: imageType
								}
							});
						})
				})
		});
	}
	function imageUpload(req, res) {
		var desktopPath = '/images/desktop/' + req.files.image.name;
		var mobilePath = '/images/mobile/' + req.files.image.name;
		var dwidth;
		var mwidth;
		var imageType;
		var reqFile = req.files.image;

		new Jimp(reqFile.path, function(err, image) {
			if (err) throw err;

			fs.unlink(reqFile.path);
			
			if (image.bitmap.width > image.bitmap.height) {
				dwidth = 620;
				mwidth = 300;
				imageType = 'wide';
			}
			else {
				dwidth = 300;
				mwidth = 100;
				imageType = 'narrow';
			}
		  
			
			image
				.clone()
				.quality(100)
				.resize(dwidth, Jimp.AUTO)
				.write('./public' + desktopPath, function() {
					image
						.quality(100)
						.resize(mwidth, Jimp.AUTO)
						.write('./public' + mobilePath, function() {
							res.send({
								success: 1,
								file: {
								  url: desktopPath,
								  dUrl: desktopPath,
								  mUrl: mobilePath,
								  imageType: imageType
								}
							});
						})
				})
		});
	}
}