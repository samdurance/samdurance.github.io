$(document).ready(function () {
    
    
    $('.tr__menubar').affix({
    offset: {     
      top: $('.tr__menubar').offset().top
      //bottom: ($('footer').outerHeight(true) + $('.application').outerHeight(true)) + 40
    }
});
});




$(document).on('click', '#start', function (e) {
    //    $('.trs__nav').fadeIn('slow');
    $('.tr__preload__overlay').addClass('layout-switch');
});





jQuery(function ($) {
    $('#squiffy').squiffy();
    var restart = function () {
        $('#squiffy').squiffy('restart');
    };
    $('#restart').click(restart);
    $('#restart').keypress(function (e) {
        if (e.which !== 13) return;
        restart();
    });
});


$('.tr__acbtn').featherlight({
    targetAttr: 'data-url',
    resetCss: true,
    closeOnEsc: true,
    closeIcon: '<span class="fa fa-times"></span>',
    afterClose: function (e) {
        $('.squiffy-section').removeClass('blur');
    }
});


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

$(".tr__themeswitch").on("click", function () {
   $('body').toggleClass('dark');
});


$(document).on('click', '.squiffy-link', function (e) {
    initSM();

    var section = $(this).attr('data-section');

    if (! $(this).hasClass('first') || $(this).hasClass('last')) {

        $.ajax({
            type: 'GET',
            url: 'js/data.json',
            dataType: 'json',
            success: function (data) {

                var notifyMsg = data[section].popup.content;
                var notifyThumb = data[section].popup.thumb;

                notify(notifyThumb, notifyMsg);

            },
            error: function (error) {}
        });
    }
});

function notify(thumb, msg) {

    $.notify({
        icon: thumb,
        message: msg
    }, {
        type: 'minimalist',
        delay: 5000,
        offset: 20,
        icon_type: 'image',
        template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
            '<img data-notify="icon" class="img-circle pull-left">' +
            '<span data-notify="title">{1}</span>' +
            '<span data-notify="message">{2}</span>' +
            '</div>'
    });

};
