var Localize = require('localize');

var localize = new Localize('./translations', "dd.mm.yyyy", "ru");

setLocale = function(req, res, next) {
	var lang = "ru";
	if (req.params.lang === "ru" || req.params.lang === "by" || req.params.lang === "en")
	{
		lang = req.params.lang;
		res.locals.lang = lang;
	};
	
    localize.setLocale(lang);
    
    res.locals.translate = localize.translate;
	res.locals.localDate = localize.localDate;
    next();
};

exports.localization = setLocale;