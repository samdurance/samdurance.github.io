//initialize instance
var enjoyhint_instance = new EnjoyHint({});

//simple config.
//Only one step - highlighting(with description) "New" button
//hide EnjoyHint after a click on the button.
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
        "next .tr__polaroid.left": 'Polaroid alike elements can be clicked. <br> You can see the full rendered image in a lightbox.',
        showSkip: false
    },
    {
        "next .tr__imgwrap": 'Moviebox alike elements can also be clicked. <br> You will see the according animation as a gif in a lightbox.',
        showSkip: false
    },
    {
        "next .tr__question": 'For every decision there will be a question. Think careful.',
        showSkip: false
    },
        {
        "next .link-section": 'Those are the decision buttons. <br> Only you can decide which way you want to go.',
        showSkip: false
    }

];

//set script config
enjoyhint_instance.set(enjoyhint_script_steps);

//run Enjoyhint script

$('#starttuto').on('click', function (e) {
    enjoyhint_instance.run();
});