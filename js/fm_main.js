$(document).ready(function () {

    $("#tr__index__menu__toggle").click(function() {
        $('.tr__index__menu-wrapper').toggleClass("open-menu");
    });


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


    //Affix for Menu story
    $('.tr__menubar').affix({
        offset: {
            top: $('.tr__menubar').offset().top
        }
    });


    //Lightbox call for reset story
    $('.tr__acbtn').featherlight({
        targetAttr: 'data-url',
        resetCss: true,
        closeOnEsc: true,
        closeIcon: '<span class="fa fa-times"></span>',
        afterClose: function (e) {
            $('.squiffy-section').removeClass('blur');
        }
    });


    //Menu story
    var Menu = {
        body: $('.tr__menu'),
        button: $('.tr__menu__btn'),
        tools: $('.tr__menu__tools')
    };

    Menu.button.click(function () {
        Menu.body.toggleClass('tr__menu--closed');
        Menu.body.toggleClass('tr__menu--open');
        Menu.tools.toggleClass('tr__menu__tools--visible');
        Menu.tools.toggleClass('tr__menu__tools--hidden');
    });


    //Themeswitch story
    $(".tr__themeswitch").on("click", function () {
        $('body').toggleClass('dark');
    });


    //BacktoTop btn
    /*var back_to_top_button = ['<a href="#top" class="back-to-top">' +
    '<span class="fa fa-chevron-circle-up"></span></a>'].join("");
    $("body").append(back_to_top_button)

    $(".back-to-top").hide();

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
    });*/

});
















