$(function(){
    var oldResponse = '',
        stopFlag = false,
        profiles = [];

    getStats();

    setInterval(function () {
        getStats();
    }, 10 * 60 * 1000);

    function getStats() {
        $.get('/front/rest/sotka')
            .success(function (res) {
                if (JSON.stringify(res) == oldResponse){
                    return;
                }

                oldResponse = JSON.stringify(res);
                stopFlag = false;
                profiles = res;

                var sum = 0;
                var olymp = 0;
                var ammount = 0,
                    common,
                    i = 0,
                    length = profiles.length;

                for (i; i < length; i++) {
                    if (profiles[i].countArray.length > 0) {
                        sum = sum + profiles[i].countArray[profiles[i].countArray.length - 1].count;
                    }
                    olymp = olymp + profiles[i].olymp || 0;
                    ammount = ammount + profiles[i].ammount;
                }

                common = {
                    common: true,
                    name: 'ВСЕГО',
                    countArray: [{
                        count: sum
                    }],
                    olymp: olymp,
                    ammount: ammount
                };

                profiles.push(common);
                length = profiles.length;

                var $table = $('#statsTable tbody');
                var $tr;
                var $td;
                var profile;
                $table.html('');
                for (i = 0; i < length; i++) {
                    profile = profiles[i];
                    $tr = $('<tr>');
                    $td = $('<td>');
                    $td.text(profile.name);
                    $tr.append($td);

                    $td = $('<td>');
                    $td.text(profile.ammount + '/' + profile.olymp);
                    $tr.append($td);

                    $td = $('<td>');
                    $td.text(profile.countArray[profile.countArray.length - 1].count);
                    $tr.append($td);

                    $td = $('<td>');
                    $td.text(((profile.countArray[profile.countArray.length - 1].count - profile.olymp) / (profile.ammount - profile.olymp)).toFixed(2));
                    $tr.append($td);

                    $table.append($tr);
                }
            })
            .error(function (err) {
                console.log(err);
            })
    }

});