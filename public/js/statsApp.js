var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"Января", "Февраля", "Марта", "Апреля", "Мая", "June", "July", "August", "September", "October", "November", "December"
	]
};

angular.module('sotkaApp', [])
    .controller('sotkaController', function($scope, $timeout, $filter, sotkaFactory) {
        $scope.style = {
            left: 0
        };
        $scope.firstTime = true;
        $scope.stopFlag = false;
        $scope.oldResponse = '';
        $scope.get = function() {
            sotkaFactory.getList()
                .success(function(response) {
                    if (JSON.stringify(response) == $scope.oldResponse){
                        return;
                    }
                    $scope.oldResponse = JSON.stringify(response);
                    $scope.stopFlag = false;
                    $scope.profiles = response;
                    var sum = 0;
                    var olymp = 0;
                    var ammount = 0,
                        common = {},
                        flag,
                        i = 0,
                        j,
                        ammountLength,
                        commonLength,
                        profile,
                        dates = [],
                        date,                     
                        length = $scope.profiles.length;
                    for (i; i < length; i++) {
                        if ($scope.profiles[i].countArray.length > 0) {
                            sum = sum + $scope.profiles[i].countArray[$scope.profiles[i].countArray.length - 1].count;
                        }
                        olymp = olymp + $scope.profiles[i].olymp || 0;
                        ammount = ammount + $scope.profiles[i].ammount;
                    }

                    common = {
                        common: true,
                        name: 'Общий конкурс',
                        countArray: [{
                            count: sum
                        }],
                        points: [],
                        olymp: olymp,
                        ammount: ammount
                    };
                                        
                    for (i = 0; i < length; i++) {
                        profile = $scope.profiles[i];
                        date = '';
                        profile.points = [];
                        ammountLength = profile.countArray.length;
                        for (j = 0; j < ammountLength; j++) {
                            if (date == dateFormat(profile.countArray[j].date, "yyyy-mm-dd")) {
                                profile.points[profile.points.length - 1].count = profile.countArray[j].count;
                            } else {
                                date = dateFormat(profile.countArray[j].date, "yyyy-mm-dd");
                                profile.points.push({
                                    count: profile.countArray[j].count,
                                    date: date
                                });
                                flag = false;
                                for (k = 0; k < dates.length; k++) {
                                    if (date == dates[k]) {
                                       flag = true;
                                       break; 
                                    }
                                }
                                if (!flag) {
                                    dates.push(date);
                                }
                            }
                            
                        }
                    }
                    dates = dates.sort();
                    if (dates[dates.length - 1] !== dateFormat(Date.now(), "yyyy-mm-dd")) {
                        dates.push(dateFormat(Date.now(), "yyyy-mm-dd"));
                    }
                    
                    for (i = 0; i < dates.length; i++) {
                        common.points.push({
                            date: dates[i],
                            count: 0
                        });
                        sum = 0;
                        for (j = 0; j < length; j++) {
                            profile = $scope.profiles[j];
                            profile.points = $filter('orderBy')(profile.points, 'date', false);
                            ammountLength = profile.points.length;
                            flag = false;
                            for (k = 0; k < ammountLength; k++) {
                                if (dates[i] == profile.points[k].date) {
                                    sum = sum + profile.points[k].count;
                                    flag = true;
                                }
                            }
                            if (!flag) {
                                for (k = 0; k < ammountLength; k++) {
                                    if (profile.points[k].date >= dates[i]) {
                                        break;
                                       
                                    }
                                }
                                if(k == 0) {k = 1;}
                                profile.points.push({
                                    date: dates[i],
                                    count: profile.points[k-1].count
                                });
                                                                
                                sum = sum + profile.points[k-1].count;
                            }
                        }
                        common.points[common.points.length - 1].count = sum;
                    }
                    

                    $scope.profiles.push(common);
                    length = $scope.profiles.length;
                   
                    $timeout(function() {
                        for (j = 0; j < length; j++) {
                            $scope.drawGraph(j, $filter('orderBy')($scope.profiles[j].points, 'date', false));
                        }
                    }, 0);
                    
                    if ($scope.firstTime) {
                        $scope.profiles[0].active = true;
                        $scope.moveNext();
                        $scope.firstTime = false;
                    }
                    $timeout(function() {
                        $scope.get();
                    }, 300000);  //  300000      
                })
                .error(function() {
                    $timeout(function() {
                        $scope.get();
                    }, 300000); //  300000  
                });
        };
        
        //TODO current year and start--end date
        window.xmin = new Date("2017-03-27").getTime();
        window.xmax = new Date("2017-05-07").getTime() - xmin;

        $scope.drawGraph = function (i, points) {
            
            var max = 0,
                data = points.map(function (d) {
                    if (d.count > max) {max = d.count;}
                    return {x: new Date(d.date).getTime() - xmin, y: d.count};
                }),
                parameters = {  title: "Examples",
                                xlabel: "Время",
                                ylabel: "Заявления",
                                xlim: [0 - (xmax - 0)/ 42, xmax + (xmax - 0) / 42],
                                ylim: [-2, max + 10] },
                plot = xkcdplot();
            data = data.filter(function(point){
                return point.x !== 0;
            });
            data.unshift({
                    x: 0,
                    y: 0
                });
            plot("#graph" + i, parameters);
            plot.plot(data,{stroke: "white"});
            plot.draw();
        };



        $scope.get();


        $scope.moveNext = function() {
            $timeout(function() {
                if (!$scope.stopFlag) {
                    $scope.style.left = $scope.style.left + 1;
                    if ($scope.style.left >= $scope.profiles.length) {
                        $scope.style.left = 0;
                    }
                } else {
                    $scope.stopFlag = false;
                }
                $scope.moveNext();
            }, 30000); //30000
        };

        $scope.moveToItem = function(num) {
            $scope.style.left = num;
            $scope.stopFlag = true;
        };
        
        $(document).on('click', '#reloadButton', function(){
            window.location.reload();
        });

    })
    .factory('sotkaFactory', function($http) {
        return {
            getList: function() {
                return $http.get('/front/rest/sotka');
            }
        };
    });