//* ========================================================================== *//
// Preloader functions //

function preloader() {
    $('.tr__story__inner').addClass('loading');
    window.addEventListener('scroll', noscroll);
}

function noscroll() {
    window.scrollTo(0, 0);
}

var preloadPictures = function (pictureUrls, callback) {
    var i,
        j,
        loaded = 0;

    for (i = 0, j = pictureUrls.length; i < j; i++) {
        (function (img, src) {
            img.onload = function () {
                console.log(img, src);
                if (++loaded == pictureUrls.length && callback) {
                    callback();
                }
            };

            // Use the following callback methods to debug
            // in case of an unexpected behavior.
            img.onerror = function () {
                alert('error loading images');
            };
            img.onabort = function () {
                alert('abort loading images');
            };

            img.src = src;
        }(new Image(), pictureUrls[i]));
    }
};


$(window).load(function () {

    preloader();

    preloadPictures(["/img/story/carkiss_no_notify.jpg", "/img/story/carkiss_yes_notify.jpg", "/img/story/carkiss_no_preset.jpg", "/img/story/carkiss_yes_preset.jpg", "/img/story/carsnuggle.jpg", "/img/story/carsnuggle_pola.jpg", "/img/story/lara_landscape_pola.jpg", "/img/story/lara_landscape.jpg", "/img/story/carkiss_yes.gif", "/img/story/carkiss_no.gif"], function () {

        if (!Modernizr.touch) {
            initSM();
            initSMheader();
        }

        setTimeout(function () {
            $('.tr__preload__loader__inner, .tr__preload__loader__para').fadeOut(1000);
            $('.tr__story__inner').addClass('loaded');
            $('.tr__story__inner').removeClass('loading');
            window.removeEventListener('scroll', noscroll);
        }, 2000);

    });


});

//* ========================================================================== *//


//Start story, switching layout
$(document).on('click', '#start', function (e) {
    $('.tr__preload__overlay').addClass('layout-switch');
    $('.tr__story__inner').addClass('started');
});


//Squiffy restart function
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


//Squiffy load and notification
$(document).on('click', '.squiffy-link', function (e) {
    initSM();

    var section = $(this).attr('data-section');

    if (!$(this).hasClass('first') || $(this).hasClass('last')) {

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
        placement: {
            from: "top",
            align: "center"
        },
        offset: {
            x: 0,
            y: 20
        },
        icon_type: 'image',
        template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
            '<img data-notify="icon" class="img-circle pull-left">' +
            '<span data-notify="title">{1}</span>' +
            '<span data-notify="message">{2}</span>' +
            '</div>'
    });

};