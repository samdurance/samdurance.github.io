// jQuery to collapse the navbar on scroll
function collapseNavbar() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }
}

$(window).scroll(collapseNavbar);
$(document).ready(collapseNavbar);

// jQuery for page scrolling feature - requires jQuery Easing plugin
/*$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});*/

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $(this).closest('.collapse').collapse('toggle');
});



$(document).ready(function () {



    // Global scroll with subnavi
    var scrollSection = function(hash){
        $('html,body').animate({
            scrollTop: $(hash).offset().top
        }, 1500, 'easeInOutExpo');
    };

    $('.page-scroll').on('click', function (event) {
        event.preventDefault();
        var hash = $(this).attr('href');
        scrollSection(hash);
    });



    $(document).on('click', '.ch2', function(e) {
        $('#squiffy-section-1').fadeOut( "slow" );
        $('#squiffy-section-2').fadeOut( "slow" );
        $('#squiffy-section-3').fadeOut( "slow" );
        $('#squiffy-section-4').fadeOut( "slow" );
    });


    $(document).on('click', '.squiffy-link', function(e) {
        var section = $(this).attr('data-section');

        $.ajax({
            type: 'GET',
            url: 'js/data.json',
            dataType: 'json',
            success: function (data) {

                var notifyMsg = data[section].popup.content;
                var notifyThumb = data[section].popup.thumb;

               // notify(notifyThumb, notifyMsg);

            },
            error: function(error) {
            }
        });
    });

       /* function notify (thumb, msg) {

        $.notify({
            icon: thumb,
            message: msg
        },{
            type: 'minimalist',
            delay: 5000,
            icon_type: 'image',
            template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
            '<img data-notify="icon" class="img-circle pull-left">' +
            '<span data-notify="title">{1}</span>' +
            '<span data-notify="message">{2}</span>' +
            '</div>'
        });*/

    //};

    $('#startstory').on('click', function(e) {
        e.preventDefault();
    });

    $('#chapter1').click(function() {
        $('#squiffy-section-1').fadeIn( "slow" );
        $('#squiffy-section-2').fadeIn( "slow" );
        $('#squiffy-section-3').fadeIn( "slow" );
        $('#squiffy-section-4').fadeIn( "slow" );
        
        $('#squiffy-section-5').fadeOut( "slow" );
        $('#squiffy-section-6').fadeOut( "slow" );
        $('#squiffy-section-7').fadeOut( "slow" );
        $('#squiffy-section-8').fadeOut( "slow" );
        $('#squiffy-section-9').fadeOut( "slow" );
        $('#squiffy-section-10').fadeOut( "slow" );
        $('#squiffy-section-11').fadeOut( "slow" );
    });

    $('#chapter2').click(function() {
        $('#squiffy-section-1').fadeOut( "slow" );
        $('#squiffy-section-2').fadeOut( "slow" );
        $('#squiffy-section-3').fadeOut( "slow" );
        $('#squiffy-section-4').fadeOut( "slow" );
        
        $('#squiffy-section-5').fadeIn( "slow" );
        $('#squiffy-section-6').fadeIn( "slow" );
        $('#squiffy-section-7').fadeIn( "slow" );
        $('#squiffy-section-8').fadeIn( "slow" );
        $('#squiffy-section-9').fadeIn( "slow" );
        $('#squiffy-section-10').fadeIn( "slow" );
        $('#squiffy-section-11').fadeIn( "slow" );
    });

    // Der Button wird mit JavaScript erzeugt und vor dem Ende des body eingebunden.
    var back_to_top_button = ['<a href="#top" class="back-to-top"><span class="fa fa-chevron-circle-up"></span></a>'].join("");
    $("body").append(back_to_top_button)

    // Der Button wird ausgeblendet
    $(".back-to-top").hide();

    // Funktion für das Scroll-Verhalten
    $(function () {
        $(window).scroll(function () {
            if ($(this).scrollTop() > 100) { // Wenn 100 Pixel gescrolled wurde
                $('.back-to-top').fadeIn();
            } else {
                $('.back-to-top').fadeOut();
            }
        });

        $('.back-to-top').click(function () { // Klick auf den Button
            $('body,html').animate({
                scrollTop: 0
            }, 800);
            return false;
        });
    });


});
