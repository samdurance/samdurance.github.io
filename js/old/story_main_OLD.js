

initSM();


//$(document).on('click', '#start', function(e) {
//    $('.trs__nav').fadeIn('slow');
//});


$(".ac-button").on("click", function(){
    $(this).children(".ripple").addClass("rippling");
    $('.squiffy-section').addClass('blur');
});


jQuery(function($){
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


$('.ac-button').featherlight({
    targetAttr: 'data-url',
    resetCss: true,
    closeOnEsc: true,
    closeIcon: '<span class="fa fa-times"></span>',
    afterClose: function(e){
        $('.squiffy-section').removeClass('blur');
    }
});


$(document).on('click', '.squiffy-link', function(e) {
    initSM();

    var section = $(this).attr('data-section');

    if(!$(this).hasClass('first')) {

        $.ajax({
            type: 'GET',
            url: 'js/data.json',
            dataType: 'json',
            success: function (data) {

                var notifyMsg = data[section].popup.content;
                var notifyThumb = data[section].popup.thumb;

                notify(notifyThumb, notifyMsg);

            },
            error: function (error) {
            }
        });
    }
});

function notify (thumb, msg) {

    $.notify({
        icon: thumb,
        message: msg
    },{
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