var Localize = require('localize');

var localize = new Localize('./translations', "dd.mm.yyyy", "ru");

setLocale = function(req, res, next) {
	var	lang = req.params.lang;	
	if (lang != "ru" && lang != "by" && lang != "en" && lang != undefined) {
		res.redirect('404.html');
	}
	else {
		if (lang == undefined) {
			lang = "ru";
		}
		else {
			res.locals.lang = lang;
		}
		localize.setLocale(lang);
    
    	res.locals.translate = localize.translate;
    	res.locals.translateObj = function(obj) {
    		return obj[res.locals.lang || "ru"] || obj["ru"]
    	};
		res.locals.localDate = localize.localDate;
    	next();
	}
	
};

exports.localization = setLocale;