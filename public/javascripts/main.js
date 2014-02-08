$(function(){
	/*$('#vk-widget').append('<div id="vk_groups"></div>');
	$.getScript('//vk.com/js/api/openapi.js?101', function() { 
		$.getScript('http://vk.com/js/api/share.js?86', function() { 
			$('#vk-like').html(VK.Share.button(false,{type: "button", text: "Поделиться"}));
			VK.Widgets.Group("vk_groups", {mode: 0, width: "298", height: "300", color1: 'FFFFFF', color2: '2B587A', color3: '5B7FA6'}, 20003922);
	   	});
    }); 
	/*$('body').prepend('<div id="fb-root"></div>'); 
	$('#fb-like').append('<div class="fb-like" data-href="http://developers.facebook.com/docs/reference/plugins/like" data-width="450" data-layout="button_count" data-action="recommend" data-show-faces="true" data-send="true"></div>'); 
   	$('#fb-widget').append('<div class="fb-like-box" data-href="http://www.facebook.com/FacebookDevelopers" data-width="298" data-height="300" data-show-faces="true" data-header="true" data-stream="false" data-show-border="true"></div>');
    $.getScript('http://connect.facebook.net/en_US/all.js#xfbml=1', function() { 
        FB.init({status: true, cookie: true/*, xfbml: true*///}); 
   // }); 
 /*   $('#tw-like').append('<a href="http://twitter.com/share" class="twitter-share-button" data-lang="en">Tweet</a>');
    script = document.createElement('script');
    script.async = true;
    script.id = 'twitter-wjs';
    script.src = '//platform.twitter.com/widgets.js';
    document.body.appendChild(script);
*/
	var npage = 0,
		cpage = 0,
		mpage = 0,
		$element = $('#menu'),
		topStop = $element.offset().top,
		bottomStop = $('footer').offset().top - $element.height();
	
	$('#flash').on('click', '.close', function(e){
		e.preventDefault();

		$('#flash').css({
            opacity:1
          }).animate({
            opacity: 0
          }, 500, 'linear', function() {
          	$('#flash').hide();
          	topStop = $element.offset().top;
			bottomStop = $('footer').offset().top - $element.height();
          });
	});

	$(window).on('scroll', function(e){
		    
      	var scrollTop = $(window).scrollTop(),
      		position = $element.offset().top;

      	bottomStop = $('footer').offset().top - $element.height();
      	if ( $element.hasClass('fixed')) {
      		
      		if (position < topStop) {
      			$element.removeClass('fixed');
      		}

      		if (scrollTop <= bottomStop) {
 				$element.removeClass('bottom');
 			}

      		
      		if (position > bottomStop) {
      			$element.addClass('bottom');
      		}

      	//	if ($element.hasClass('bottom')) {
 				
 			
	 	//	}
     	}
     	else {
	     	if (position <= scrollTop) {
		    	$element.addClass('fixed');
		    }
		}
	});

	$('#news.more-link').click(function(e) {
		e.preventDefault();
		if ($('.style-blue').find('.nomore').length === 0) {
			var that = this;
			$(this).addClass('loading-start');
			$.get($(this).attr('href') + npage, function(data) {
				npage++;
				$('.style-blue .section-bottom').before($(data));
				$('.ajax').animate({opacity: 1}, function(){
					$('.ajax').removeClass('ajax');
					$(that).removeClass('loading-start');
					bottomStop = $('footer').offset().top - $element.height();
				});
			});
		};
	});

	$('#congratulations.more-link').click(function(e) {
		e.preventDefault();
		if ($('.style-green').find('.nomore').length === 0) {
			var that = this;
			$(this).addClass('loading-start');
			$.get($(this).attr('href') + cpage, function(data) {
				cpage++;
				$('.style-green .section-bottom').before($(data));
				$('.ajax').animate({opacity: 1}, function(){
					$('.ajax').removeClass('ajax');
					$(that).removeClass('loading-start');
					bottomStop = $('footer').offset().top - $element.height();

				});
			});
		};
	});
	$('#media.more-link').click(function(e) {
		e.preventDefault();
		if ($('.style-yellow').find('.nomore').length === 0) {
			var that = this;
			$(this).addClass('loading-start');
			$.get($(this).attr('href') + mpage, function(data) {
				mpage++;
				$('.style-yellow .section-bottom').before($(data));
				$('.ajax').animate({opacity: 1}, function(){
					$('.ajax').removeClass('ajax');
					$(that).removeClass('loading-start');
					bottomStop = $('footer').offset().top - $element.height();
				});
			});
		};
	});

});