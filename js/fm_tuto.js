var enjoyhint_instance = new EnjoyHint({});

var enjoyhint_script_steps = [
    {
        "next .tr__chapter__headline": "Here you see the title of the current chapter.",
        showSkip: false
    },
    {
        "next .tr__themeswitch": "This is the switch to change colorthemes. Depending if you'd rather read on a light background or dark background, you can adjust it any time.",
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
        "next .story": "If you're stuck or want to restart the story, you click here.",
        showSkip: false
    },
    {
        "next .tr__polaroid": 'Polaroid elements can be clicked to see the full image.',
        showSkip: false,
        margin: 15
    },
    {
        "next .tr__movie__wrapper": 'Moviebox alike elements can also be clicked.',
        showSkip: false,
        margin: 15
    },
    {
        "next .tr__question": 'For every decision there will be a question. Think careful.',
        showSkip: false
    },
    {
        "next .link-section": 'Those are the decision buttons.',
        showSkip: false
    },

    {
        "next .tr__tutorial__footer": "This is everything you need to know for now. Have fun reading the teaser!",
        showSkip: false,
        nextButton: {className: '', text:'Close'}
    }

];

enjoyhint_instance.set(enjoyhint_script_steps);

$('#starttuto').on('click', function (e) {
    enjoyhint_instance.run();
});