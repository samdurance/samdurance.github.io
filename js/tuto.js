//initialize instance
var enjoyhint_instance = new EnjoyHint({});

//simple config.
//Only one step - highlighting(with description) "New" button
//hide EnjoyHint after a click on the button.
var enjoyhint_script_steps = [
    {
        "next .tr__chapter__headline": 'Hello, I\'d like to tell you about EnjoyHint.<br> Click "Next" to proceed.'
    },
    {
        "next .info": "You can select different blocks. For example, let's select title.<br>" +
            "This event has a very simple code.<br>" +
            "{<br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' next #title '</text> : <text style='color: #2bff3c'>' Some description '</text> <br>" +
            "}<br>" +
            "<text style='color: #00ebe7'>next</text> - event (all events are described in the documentation)<br>" +
            "<text style='color: #00ebe7'>#title</text> - selector <br>" +
            "<text style='color: #00ebe7'>Some description</text> - Description for the block <br>"
    },
    {
        "next .restart": "For example, let's set a handler for a button click event.<br>" +
            "{<br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' click .btn-success '</text> : <text style='color: #2bff3c'>' Some description '</text> <br>" +
            "}<br>" +
            "Click the button and move on.",
        showSkip: false
    },
    {
        "next .tr__polaroid.left": "You can highlight blocks by selecting them in a circle. <br>" +
            "<text style='color: #00ebe7'>shape</text> - you can define shape of highligting (rectangular||circle)<br>" +
            "{<br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' next #selector '</text> : <text style='color: #2bff3c'>' Some description ',</text> <br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' shape '</text> :  <text style='color: #2bff3c'>' circle '</text> <br>" +
            "}<br>" +
            "The circle radius seems to be too small.<br> Click 'Next' to fix it.",
        shape: 'rect'
    },
    {
        "next .tr__imgwrap": "Sometimes you need to scroll the page either very slowly (as we've just done) or very fast.<br>" +
            "<text style='color: #00ebe7'>scrollAnimationSpeed</text> - sets the speed for the scroll page<br>" +
            "{<br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' next #selector '</text> : <text style='color: #2bff3c'>' Some description ',</text> <br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' scrollAnimationSpeed '</text> : 2500<br>" +
            "}<br>",
        shape: 'rect'
    },
    {
        "next .tr__btnwrap": "Sometimes you need to scroll the page either very slowly (as we've just done) or very fast.<br>" +
            "<text style='color: #00ebe7'>scrollAnimationSpeed</text> - sets the speed for the scroll page<br>" +
            "{<br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' next #selector '</text> : <text style='color: #2bff3c'>' Some description ',</text> <br>" +
            "<text style='color: #00a6eb'>&nbsp &nbsp ' scrollAnimationSpeed '</text> : 2500<br>" +
            "}<br>",
        shape: 'rect'
    }

];

//set script config
enjoyhint_instance.set(enjoyhint_script_steps);

//run Enjoyhint script

$('#starttuto').on('click', function (e) {
    enjoyhint_instance.run();
});