var enjoyhint_instance = new EnjoyHint({});

var enjoyhint_script_steps = [
    {
        "next .info": 'This is the Tutorial button<br> Click it and you will always come back to this site.',
        showSkip: false
    },
    {
        "next .restart": 'This is the Restart button<br> Click it and you will restart the story. All progress will be lost.',
        showSkip: false
    },
    {
        "next .tr__chapter__headline": 'Here you see the recent headline for the chapter.',
        showSkip: false
    },
    {
        "next .tr__polaroid": 'Polaroid alike elements can be clicked. <br> You can see the full rendered image in a lightbox.',
        showSkip: false
    },
    {
        "next .tr__movie__wrapper": 'Moviebox alike elements can also be clicked. <br> You will see the according animation as a gif in a lightbox.',
        showSkip: false
    },
    {
        "next .tr__question": 'For every decision there will be a question. Think careful.',
        showSkip: false
    },
        {
        "next .link-section": 'Those are the decision buttons. <br> Only you can decide which way you want to go.',
        showSkip: false
        },
        {
        "next .tr__tutorial__footer": 'Dat wars erstmal und tschö mit ö',
        showSkip: false
    }

];

enjoyhint_instance.set(enjoyhint_script_steps);

$('#starttuto').on('click', function (e) {
    enjoyhint_instance.run();
});