$(document).ready(function () {

    //Index Menu toggle
    $("#tr__index__menu__toggle").click(function (e) {
        e.preventDefault();
        $('.tr__index__menu-wrapper').toggleClass("open-menu");
    });

    $("#startstory").click(function (e) {
        e.preventDefault();
    });

    // Global scroll with subnavi
    var scrollSection = function (hash) {
        $('html,body').animate({
            scrollTop: $(hash).offset().top
        }, 1500, 'easeInOutExpo');
    };

    $('.page-scroll').on('click', function (event) {
        event.preventDefault();
        var hash = $(this).attr('href');

        if ($(window).width() < 480) {
            $('.tr__index__menu-wrapper').removeClass('open-menu');
            scrollSection(hash);
        } else {
            scrollSection(hash);
        }
    });


    //Affix for Menu story
    if(!$('body').hasClass('tr__index')) {
        $('.tr__menubar').affix({
            offset: {
                top: $('.tr__menubar').offset().top
            }
        });
    }


    //Lightbox call for reset story
    //$('.tr__acbtn').featherlight({
    //    targetAttr: 'data-url',
    //    resetCss: true,
    //    closeOnEsc: true,
    //    closeIcon: '<span class="fa fa-times"></span>',
    //    afterClose: function (e) {
    //        $('.squiffy-section').removeClass('blur');
    //    }
    //});


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
    $(".tr__themeswitch").on("click", function (e) {
        e.preventDefault();
        $(this).toggleClass('switch');
        $('body').toggleClass('dark');
    });

});