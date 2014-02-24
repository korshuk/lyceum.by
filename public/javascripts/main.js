$(function () {
    "use strict";

    var npage = 0,
        cpage = 0,
        mpage = 0,
        $element = $('#menu'),
        topStop = $element.offset().top,
        bottomStop = $('footer').offset().top - $element.height();

    $('#flash').on('click', '.close', function (e) {
        e.preventDefault();

        $('#flash').css({opacity : 1}).animate({opacity: 0}, 500, 'linear', function () {
            $('#flash').hide();
            topStop = $element.offset().top;
            bottomStop = $('footer').offset().top - $element.height();
        });
    });

    $(window).on('scroll', function (e) {
        var scrollTop = $(window).scrollTop(),
            position = $element.offset().top;
        bottomStop = $('footer').offset().top - $element.height();
        if ($element.hasClass('fixed')) {
            if (position < topStop) {
                $element.removeClass('fixed');
            }
            if (scrollTop <= bottomStop) {
                $element.removeClass('bottom');
            }
            if (position > bottomStop) {
                $element.addClass('bottom');
            }
        } else {
            if (position <= scrollTop) {
                $element.addClass('fixed');
            }
        }
    });

    $('#news.more-link').click(function (e) {
        e.preventDefault();
        if ($('.style-blue').find('.nomore').length === 0) {
            var that = this;
            $(this).addClass('loading-start');
            $.get($(this).attr('href') + npage, function (data) {
                npage++;
                $('.style-blue .section-bottom').before($(data));
                $('.ajax').animate({opacity: 1}, function () {
                    $('.ajax').removeClass('ajax');
                    $(that).removeClass('loading-start');
                    bottomStop = $('footer').offset().top - $element.height();
                });
            });
        };
    });

    $('#congratulations.more-link').click(function (e) {
        e.preventDefault();
        if ($('.style-green').find('.nomore').length === 0) {
            var that = this;
            $(this).addClass('loading-start');
            $.get($(this).attr('href') + cpage, function (data) {
                cpage++;
                $('.style-green .section-bottom').before($(data));
                $('.ajax').animate({opacity: 1}, function (){
                    $('.ajax').removeClass('ajax');
                    $(that).removeClass('loading-start');
                    bottomStop = $('footer').offset().top - $element.height();

                });
            });
        };
    });
    $('#media.more-link').click(function (e) {
        e.preventDefault();
        if ($('.style-yellow').find('.nomore').length === 0) {
            var that = this;
            $(this).addClass('loading-start');
            $.get($(this).attr('href') + mpage, function (data) {
                mpage++;
                $('.style-yellow .section-bottom').before($(data));
                $('.ajax').animate({opacity: 1}, function (){
                    $('.ajax').removeClass('ajax');
                    $(that).removeClass('loading-start');
                    bottomStop = $('footer').offset().top - $element.height();
                });
            });
        };
    });

    $('aside .small').on('click', '#fb-like a, #vk-like a', function (e){
        e.preventDefault();
        var left = (screen.width/2)-(300);
        var top = (screen.height/2)-(150);
        window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600,top='+top+',left='+left);
    });       

    if ($('#map-canvas').length){
        function initialize() {
            var Latlng = new google.maps.LatLng(53.896601,27.565727);
            var mapOptions = {
                center: Latlng,
                zoom: 15
            };
            var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            var image = '/img/map.png';
            var marker = new google.maps.Marker({
                position: Latlng,
                map: map,
                title: 'Лицей БГУ',
                icon: image
            });
        }
        google.maps.event.addDomListener(window, 'load', initialize);
    }
});