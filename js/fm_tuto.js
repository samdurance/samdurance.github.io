var enjoyhint_instance = new EnjoyHint({});

var enjoyhint_script_steps = [
    {
        "next .tr__chapter__headline": 'Here you see the title of the current chapter.',
        showSkip: false
    },
    {
        "click .tr__themeswitch": 'Themeswitch'
    },
    {
        "click .tr__menu": 'Menubutton',
        showSkip: false
    },
    {
        "next .home": 'Home Button',
        showSkip: false,
        timeout: 1000
    },
    {
        "next .tuto": 'Tuto Button',
        showSkip: false
    },
    {
        "next .story": 'Story Button',
        showSkip: false
    },
    {
        "next .tr__polaroid": 'Polaroid elements can be clicked to see the full image.',
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
        "next .tr__movie__wrapper": 'Moviebox alike elements can also be clicked.',
        showSkip: false,
        margin: 15
    },
    {
        "next .tr__tutorial__footer": 'Dat wars erstmal und tschö mit ö',
        showSkip: false,
        nextButton: {className: '', text:'Close'}
    }

];

enjoyhint_instance.set(enjoyhint_script_steps);

$('#starttuto').on('click', function (e) {
    enjoyhint_instance.run();
});