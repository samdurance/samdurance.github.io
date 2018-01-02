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
                if (++loaded == pictureUrls.length && callback) {
                    callback();
                }
            };

            // Use the following callback methods to debug
            // in case of an unexpected behavior.
            img.onerror = function () {};
            img.onabort = function () {};

            img.src = src;
        }(new Image(), pictureUrls[i]));
    }
};


$(window).load(function () {

    preloader();

    preloadPictures(["/img/story/carkiss_no.jpg", "/img/story/carkiss_yes.jpg", "/img/story/carkiss_yes.gif", "/img/story/carkiss_yes_preset.jpg", "/img/story/carsnuggle.jpg", "/img/story/carsnuggle_pola.jpg"], function () {

        initSM();
        initSMheader();

        setTimeout(function () {
            $('.tr__preload__loader__inner, .tr__preload__loader__para').fadeOut(1000);
            $('.tr__story__inner').addClass('loaded');
            $('.tr__story__inner').removeClass('loading');
            window.removeEventListener('scroll', noscroll);
        }, 2000);

    });


});
