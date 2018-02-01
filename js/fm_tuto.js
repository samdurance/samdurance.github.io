$(document).ready(function(){

    $(this).scrollTop(0);

    var enjoyhint_instance = new EnjoyHint({
        onEnd: function () {
            $('html, body').animate({
                    scrollTop: $(document).height() - $(window).height()
                },
                1400,
                "easeOutQuint"
            );

            $('.tr__menu__tools a').each(function(e) {
                $(this).removeClass('tr__tutorial__menulink');
            });
        }
    });

    var enjoyhint_script_steps = [
        {
            "next .tr__chapter__headline": "Here you see the title of the current chapter.",
            showSkip: false
        },
        {
            "click .tr__menu": "This is the menu button. Click it!",
            showSkip: false
        },
        {
            "next .home": "Here you can return to the index page.",
            showSkip: false,
            timeout: 1000
        },
        {
            "next .tuto": "This button will lead you to the tutorial page.",
            showSkip: false
        },
        {
            "next .tr__themeswitch": "This is the switch to change color themes,<br> depending on if you'd rather read on a light or dark background.<br>You can adjust it at any time.",
            showSkip: false
        },
        {
            "next .story": "If you're stuck or want to restart the story, click here.",
            showSkip: false
        },
        {
            "next .tr__polaroid": 'Polaroid elements can be clicked to see the full image.',
            showSkip: false,
            margin: 15
        },
        {
            "next .tr__movie__wrapper": 'Moviebox alike elements can also be clicked.<br>They represent gifs.',
            showSkip: false,
            margin: 15
        },
        {
            "next .tr__question": 'For every decision there will be a question. <br>Think carefully.',
            showSkip: false
        },
        {
            "next .link-section": 'Those are the decision buttons.',
            showSkip: false,
            nextButton: {className: '', text: 'Close'}
        }
    ];

    enjoyhint_instance.set(enjoyhint_script_steps);

    $('#starttuto').on('click', function (e) {
        enjoyhint_instance.run();
    });

});