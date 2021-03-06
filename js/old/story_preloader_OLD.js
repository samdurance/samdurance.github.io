
function preloader() {
	$('.ip-container').addClass('loading');
	window.addEventListener( 'scroll', noscroll );
}

function noscroll() {
	window.scrollTo( 0, 0 );
}

var preloadPictures = function(pictureUrls, callback) {
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
		} (new Image(), pictureUrls[i]));
	}
};


$(window).load( function() {

	preloader();

	preloadPictures(["/img/story/animals.jpg", "/img/story/animals_polaroid.jpg", "/img/story/animals_big.jpg", "/img/story/test.gif", "https://media.giphy.com/media/O5AZJzYhCr1NS/giphy.gif", "https://media.giphy.com/media/nNott3XnNjDDq/giphy.gif", "https://media.giphy.com/media/cSaX029U8Nies/giphy.gif"], function () {
		$('.popcorn').fadeOut(3000);
		$('.ip-container').removeClass('loading');
		$('.ip-container').addClass('loaded');
		$('body').addClass('layout-switch');
		window.removeEventListener( 'scroll', noscroll );
	});

});