/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
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
        //if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
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

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};

$.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
        var min = parseInt( $('#minTable').val(), 10 );
        var max = parseInt( $('#maxTable').val(), 10 );
        var pass = parseFloat( data[10] ) || 0;
        if ( ( isNaN( min ) && isNaN( max ) ) ||
             ( isNaN( min ) && pass <= max ) ||
             ( min <= pass   && isNaN( max ) ) ||
             ( min <= pass   && pass <= max ) )
        {
            return true;
        }
        return false;
    }
);

$.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
        var min = parseInt( $('#minTable1').val(), 10 );
        var max = parseInt( $('#maxTable1').val(), 10 );
        var pass = parseFloat( data[8] ) || 0;
        if ( ( isNaN( min ) && isNaN( max ) ) ||
             ( isNaN( min ) && pass <= max ) ||
             ( min <= pass   && isNaN( max ) ) ||
             ( min <= pass   && pass <= max ) )
        {
            return true;
        }
        return false;
    }
);

$.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
        var min = parseInt( $('#minTable2').val(), 10 );
        var max = parseInt( $('#maxTable2').val(), 10 );
        var pass = parseFloat( data[9] ) || 0;
        if ( ( isNaN( min ) && isNaN( max ) ) ||
             ( isNaN( min ) && pass <= max ) ||
             ( min <= pass   && isNaN( max ) ) ||
             ( min <= pass   && pass <= max ) )
        {
            return true;
        }
        return false;
    }
);

$.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
        var values = [];
        var subValues = [];
        var profile = data[6];
        var subcode = data[7];
        var checkboxvalue;
        var signIndex;
        $('#profileChecker :checked').each(function() {
            checkboxvalue = $(this).val();
            signIndex = checkboxvalue.indexOf('&');
            if (signIndex < 0) {
                values.push($(this).val());
            } else {
                values.push($(this).val().substring(0, signIndex));
                subValues.push($(this).val().substring(signIndex + 1));
            }
           
        });
 
        if (values.indexOf(profile) > -1 ) {
            if (subcode) {
                return subValues.indexOf(subcode) > -1;
            } else {
                return true;
            }
        }
        return false;
    }
);

$(function() {
    var profiles;

    $.get('/admin/exams/profiles', function(response) {
        updateProfilesList(response);
    });


    var currentUser = {};
    var table = $('#examGrid').DataTable({
        ajax: {
            url: '/admin/exams/rest',
            dataSrc: ''
        },
        columnDefs: [ 
                {
                    searchable: false,
                    orderable: false,
                    targets: 0
                },
                {
                    targets: -1,
                    data: null,
                    searchable: false,
                    orderable: false,
                    defaultContent: "<button class='btn btn-primary'>Редактировать</button><br><br><button class='btn btn-danger'>Удалить</button>"
                } 
            ],
        order: [[ 1, 'asc' ]],
        columns: [
            { data: null },
            { data: 'passport' },
            { data: 'data[0].vid' },
            { data: 'data[0].lastname' },
            { data: 'data[0].firstname' },
            { data: 'data[0].patronymic' },
            { data: 'data[0].profile' },
            { data: 'data[0].subcode' },
            { data: 'data[0].exam1' },
            { data: 'data[0].exam2' },
            { data: 'data[0].sum' },
            { data: 'data[0].pass' },
            { data: null },
        ]
    });

    table.on( 'order.dt search.dt', function () {
        table.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
            cell.innerHTML = i+1;
        } );
    } ).draw();

    table.on( 'click', '.btn-danger', function () {
         var data = table.row( $(this).parents('tr') ).data();
         currentUser = data;
         $('#removePupilModal').modal('show');
    });
    
    table.on( 'click', '.btn-primary', function () {
        var data = table.row( $(this).parents('tr') ).data();
        $.get('/admin/exams/rest/' + data._id, function (response) {
            currentUser = response;
            var userData = response.data.slice(-1)[0];
            $('#passport').val(response.passport);

            $('#lastname').val(userData.lastname);
            $('#firstname').val(userData.firstname);
            $('#patronymic').val(userData.patronymic);
            

            $.each(profiles, function (i, profile) {
                $('#profiles').append($('<option>', {
                    value: profile.code,
                    text : profile.name 
                }));
            });

            $('#profiles').val(userData.profile);

            $('#exam1').val(userData.exam1);
            $('#exam2').val(userData.exam2);
            $('#sum').val(userData.sum);
            $('#pass').val(String(userData.pass));
            $('#message').val(String(userData.message || ''));
            $('#examModal').modal('show');
        })
    });

    $('#profileChecker').on('click', 'input', function(){
        table.draw();
    });

    $('#minTable, #maxTable, #minTable1, #maxTable1, #minTable2, #maxTable2').change( function() {
        table.draw();
    } );
    
    $(document).on('click', '#removePupil', function() {
        $.post('/admin/exams/rest/' + currentUser._id + '/delete', function (response) {
            $('#removePupilModal').modal('hide'); 
            table.ajax.reload();
            currentUser = {};
         });
    });

    $(document).on('click', '#updatePupil', function() {
        currentUser.passport = $('#passport').val();
        currentUser.data[currentUser.data.length - 1].lastname = $('#lastname').val();
        currentUser.data[currentUser.data.length - 1].firstname = $('#firstname').val();
        currentUser.data[currentUser.data.length - 1].patronymic = $('#patronymic').val();
        currentUser.data[currentUser.data.length - 1].profile = $('#profiles').val();
        currentUser.data[currentUser.data.length - 1].exam1 = $('#exam1').val();
        currentUser.data[currentUser.data.length - 1].exam2 = $('#exam2').val();
        currentUser.data[currentUser.data.length - 1].pass= $('#pass').val() == 'true';
        currentUser.data[currentUser.data.length - 1].message = $('#message').val();
        $.post('/admin/exams/rest/' + currentUser._id, currentUser, function (response) {
            $('#examModal').modal('hide'); 
            table.ajax.reload();
            currentUser = {};
        }, "json");
    });

    $(document).on('click', '#versionBtn', function() {
        $.get('/admin/exams/version-list', function(response) {
            var $template = $('<ul></ul>');
            var $item;
            var date;
            var options = {year: "numeric", month: "short",day: "numeric"};

            $template.addClass('list-group');
            for (var i = 0; i < response.length; i++) {
                date = new Date(response[i].date);
                $item = $('<li></li>')
                    .addClass('row list-group-item')
                    .text(response[i].vid + ' ' + date.toDateString("ru-ru", options) + ' ' + date.toTimeString("ru-ru", options))
                    .append('<a href="/admin/exams/deleteversion/' + response[i]._id + '" class="pull-right btn btn-danger">Delete</button>');
                $template.append($item);
            };
            $('#versionModal').find('.modal-body').html($template).end().modal('show');
        });
    });

    function updateProfilesList(response) {
        profiles = response;
        var $copyRow = $('.copy-row').html();
        var $newRow = '';
        var $profileForm = $('.profiles-form tbody');
        var $profileChecker = $('#profileChecker');
        var checkboxvalue;

        $profileForm.html('');
        $profileChecker.html('');

        $profileForm.append('<tr class="copy-row">' + $copyRow + '</tr>');
        $('#firstExamDate').datetimepicker();
        $('#secondExamDate').datetimepicker();
        $('#firstExamAppelationDate').datetimepicker();
        $('#secondExamAppelationDate').datetimepicker();

        for (var i = response.length - 1; i >= 0; i--) {
            if (response[i].subcode) {
                checkboxvalue = response[i].code + '&' + response[i].subcode;
            }
            else {
                checkboxvalue = response[i].code;
            }
            $profileChecker.append('<label class="checkbox"><input type="checkbox" value="' + checkboxvalue + '" checked="true">' + response[i].name + '</label>');

            $newRow = $copyRow.replace('<button id="addProfile" type="button" class="btn btn-primary">Add</button>',
                '<button data-num="' + i + '" data-id="' + response[i]._id + '" type="button" class="btn btn-primary profiles-update-btn">Update</button><br><br><button data-num="' + i + '" data-id="' + response[i]._id + '" type="button" class="btn btn-danger profiles-remove-btn">Remove</button>');

            $newRow = $newRow.replace(/ id="(.*?)"/g, ' id="$1_' + i + '"');
            $profileForm.append('<tr>' + $newRow + '</tr>');
            $('#name_'+i).val(response[i].name),
            $('#code_'+i).val(response[i].code),
            $('#subcode_'+i).val(response[i].subcode),
            $('#firstExamName_'+i).val(response[i].firstExamName);
            $('#firstExamDate_'+i).val(dateFormat(new Date(response[i].firstExamDate),'yyyy/mm/dd HH:MM'));
            $('#firstExamPlace_'+i).val(response[i].firstExamPlace);
            $('#firstExamAppelationDate_'+i).val(dateFormat(new Date(response[i].firstExamAppelationDate),'yyyy/mm/dd HH:MM'));
            $('#secondExamName_'+i).val(response[i].secondExamName);
            $('#secondExamDate_'+i).val(dateFormat(new Date(response[i].secondExamDate),'yyyy/mm/dd HH:MM'));
            $('#secondExamAppelationDate_'+i).val(dateFormat(new Date(response[i].secondExamAppelationDate),'yyyy/mm/dd HH:MM'));
            $('#secondExamPlace_'+i).val(response[i].secondExamPlace);
            $('#firstIsFirst_'+i).prop( "checked", response[i].firstIsFirst);
            $('#passT_'+i).text(response[i].passT);
            $('#minT_'+i).text(response[i].minT);
            $('#maxT_'+i).text(response[i].maxT);
            $('#passF_'+i).text(response[i].passF);
            $('#minF_'+i).text(response[i].minF);
            $('#maxF_'+i).text(response[i].maxF);
            $('#passS_'+i).text(response[i].passS);
            $('#minS_'+i).text(response[i].minS);
            $('#maxS_'+i).text(response[i].maxS);
            $('#halfDelta_'+i).text(response[i].halfDelta);
            $('#halfPupils_'+i).text(response[i].halfPupils);
            $('#olimp_'+i).text(response[i].olimp);
            $('#halfpass_'+i).text(response[i].halfpass);
            $('#ammount_'+i).val(response[i].ammount);
            $('#totalUploaded_'+i).prop( "checked", response[i].totalExamUploaded);
            $('#firstUploaded_'+i).prop( "checked", response[i].firstExamUploaded);
            $('#secondUploaded_'+i).prop( "checked", response[i].secondExamUploaded);
            $('#firstExamNoStats_'+i).prop( "checked", response[i].firstExamNoStats);
            $('#firstExamDate_' + i).datetimepicker();
            $('#secondExamDate_' + i).datetimepicker();
            $('#firstExamAppelationDate_' + i).datetimepicker();
            $('#secondExamAppelationDate_' + i).datetimepicker();

        }
        table.draw();
    }

    $(document).on('click', '#classBtn', function(){
        $.get('/admin/exams/profiles', function(response) {
            updateProfilesList(response);
            $('#classModal').modal('show');
        });
    });

    $(document).on('click', '.profiles-update-btn', function () {
        var num = $(this).data('num');
        var id = $(this).data('id');

        $('#ammount_'+num).removeClass('has-error');
        var data = {
            name: $('#name_'+num).val(),
            code: $('#code_'+num).val(),
            subcode: $('#subcode_'+num).val(),
            firstExamName: $('#firstExamName_'+num).val(),
            firstExamDate: $('#firstExamDate_'+num).val(),
            firstExamAppelationDate: $('#firstExamAppelationDate_'+num).val() === 'NaN/NaN/NaN NaN:NaN' ? null : $('#firstExamAppelationDate_'+num).val(),
            firstExamPlace: $('#firstExamPlace_'+num).val(),
            secondExamName: $('#secondExamName_'+num).val(),
            secondExamDate: $('#secondExamDate_'+num).val(),
            secondExamAppelationDate: $('#secondExamAppelationDate_'+num).val() === 'NaN/NaN/NaN NaN:NaN' ? null : $('#secondExamAppelationDate_'+num).val(),
            secondExamPlace: $('#secondExamPlace_'+num).val(),
            ammount: $('#ammount_'+num).val(),
            firstIsFirst:  $('#firstIsFirst_'+num).prop( "checked"),
            totalExamUploaded: $('#totalUploaded_'+num).prop( "checked"),
            firstExamUploaded: $('#firstUploaded_'+num).prop( "checked"),
            firstExamNoStats: $('#firstExamNoStats_'+num).prop( "checked"),
            secondExamUploaded: $('#secondUploaded_'+num).prop( "checked"),
        };
        if (data.ammount > 0) {
            $.post('/admin/exams/profiles/' + id, data, function(response) {
                console.log(response);
                updateProfilesList(response)
            });
        } else {
            $('#ammount_'+num).addClass('has-error');
        }
        
    });

    $(document).on('click', '.profiles-remove-btn', function () {
        var id = $(this).data('id');
        $.post('/admin/exams/profiles/delete/' + id, {}, function(response) {
            $('#ammount').removeClass('has-error');
            updateProfilesList(response)
        });
    });

    $(document).on('click', '#addProfile', function(){
        $('#ammount').removeClass('has-error');
        var data = {
            name: $('#name').val(),
            code: $('#code').val(),
            subcode: $('#subcode').val(),
            firstExamName: $('#firstExamName').val(),
            firstExamDate: $('#firstExamDate').val(),
            firstExamAppelationDate: $('#firstExamAppelationDate').val(),
            firstExamPlace: $('#firstExamPlace').val(),
            secondExamName: $('#secondExamName').val(),
            secondExamDate: $('#secondExamDate').val(),
            secondExamAppelationDate: $('#secondExamAppelationDate').val(),
            secondExamPlace: $('#secondExamPlace').val(),
            firstIsFirst:  $('#firstIsFirst').prop( "checked"),
            ammount: $('#ammount').val(),
        };
        if (data.ammount > 0) {
            $.post('/admin/exams/profiles', data, function(response) {
                console.log(response);
                updateProfilesList(response)
            });
        } else {
            $('#ammount').addClass('has-error');
        }
    });
});


