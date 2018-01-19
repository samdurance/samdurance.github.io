var enjoyhint_instance = new EnjoyHint({});

var enjoyhint_script_steps = [
    {
        "next .info": 'This is the Tutorial button<br> Click it and you will always come back to this site.'
    },
    {
        "next .restart": 'This is the Restart button<br> Click it and you will restart the story. All progress will be lost.',
        showSkip: false
    },
    {
        "next .tr__chapter__headline": 'Here you see the title of the current chapter.',
        showSkip: false
    },
    {
        "next .tr__polaroid": 'Polaroid elements can be clicked to see the full image.',
        showSkip: false,
        margin: 15
    },
    {
        "next .tr__movie__wrapper": 'Moviebox alike elements can also be clicked. <br> You will see the according animation as a gif in a lightbox.',
        showSkip: false,
        margin: 15
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
        showSkip: false,
        nextButton: {className: '', text:'Close'}
    }

];

enjoyhint_instance.set(enjoyhint_script_steps);

$('#starttuto').on('click', function (e) {
    enjoyhint_instance.run();
});


$(".tr__themeswitch").on("click", function () {
   $(this).toggleClass('dark');
});