// Created with Squiffy 5.1.0
// https://github.com/textadventures/squiffy

(function(){
/* jshint quotmark: single */
/* jshint evil: true */

var squiffy = {};

(function () {
    'use strict';

    squiffy.story = {};

    var initLinkHandler = function () {
        var handleLink = function (link) {
            if (link.hasClass('disabled')) return;
            var passage = link.data('passage');
            var section = link.data('section');
            var rotateAttr = link.attr('data-rotate');
            var sequenceAttr = link.attr('data-sequence');
            if (passage) {
                disableLink(link);
                squiffy.set('_turncount', squiffy.get('_turncount') + 1);
                passage = processLink(passage);
                if (passage) {
                    //currentSection.append('<hr/>');
                    squiffy.story.passage(passage);
                }
                var turnPassage = '@' + squiffy.get('_turncount');
                if (turnPassage in squiffy.story.section.passages) {
                    squiffy.story.passage(turnPassage);
                }
                if ('@last' in squiffy.story.section.passages && squiffy.get('_turncount')>= squiffy.story.section.passageCount) {
                    squiffy.story.passage('@last');
                }
            }
            else if (section) {
                //currentSection.append('<hr/>');
                disableLink(link);
                section = processLink(section);
                squiffy.story.go(section);
            }
            else if (rotateAttr || sequenceAttr) {
                var result = rotate(rotateAttr || sequenceAttr, rotateAttr ? link.text() : '');
                link.html(result[0].replace(/&quot;/g, '"').replace(/&#39;/g, '\''));
                var dataAttribute = rotateAttr ? 'data-rotate' : 'data-sequence';
                link.attr(dataAttribute, result[1]);
                if (!result[1]) {
                    disableLink(link);
                }
                if (link.attr('data-attribute')) {
                    squiffy.set(link.attr('data-attribute'), result[0]);
                }
                squiffy.story.save();
            }
        };

        squiffy.ui.output.on('click', 'a.squiffy-link', function () {
            handleLink(jQuery(this));
        });

        squiffy.ui.output.on('keypress', 'a.squiffy-link', function (e) {
            if (e.which !== 13) return;
            handleLink(jQuery(this));
        });

        squiffy.ui.output.on('mousedown', 'a.squiffy-link', function (event) {
            event.preventDefault();
        });
    };

    var disableLink = function (link) {
        link.addClass('disabled');
        link.attr('tabindex', -1);
    }

    squiffy.story.begin = function () {
        if (!squiffy.story.load()) {
            squiffy.story.go(squiffy.story.start);
        }
    };

    var processLink = function(link) {
		link = String(link);
        var sections = link.split(',');
        var first = true;
        var target = null;
        sections.forEach(function (section) {
            section = section.trim();
            if (startsWith(section, '@replace ')) {
                replaceLabel(section.substring(9));
            }
            else {
                if (first) {
                    target = section;
                }
                else {
                    setAttribute(section);
                }
            }
            first = false;
        });
        return target;
    };

    var setAttribute = function(expr) {
        var lhs, rhs, op, value;
        var setRegex = /^([\w]*)\s*=\s*(.*)$/;
        var setMatch = setRegex.exec(expr);
        if (setMatch) {
            lhs = setMatch[1];
            rhs = setMatch[2];
            if (isNaN(rhs)) {
                squiffy.set(lhs, rhs);
            }
            else {
                squiffy.set(lhs, parseFloat(rhs));
            }
        }
        else {
            var incDecRegex = /^([\w]*)\s*([\+\-])=\s*(.*)$/;
            var incDecMatch = incDecRegex.exec(expr);
            if (incDecMatch) {
                lhs = incDecMatch[1];
                op = incDecMatch[2];
                rhs = parseFloat(incDecMatch[3]);
                value = squiffy.get(lhs);
                if (value === null) value = 0;
                if (op == '+') {
                    value += rhs;
                }
                if (op == '-') {
                    value -= rhs;
                }
                squiffy.set(lhs, value);
            }
            else {
                value = true;
                if (startsWith(expr, 'not ')) {
                    expr = expr.substring(4);
                    value = false;
                }
                squiffy.set(expr, value);
            }
        }
    };

    var replaceLabel = function(expr) {
        var regex = /^([\w]*)\s*=\s*(.*)$/;
        var match = regex.exec(expr);
        if (!match) return;
        var label = match[1];
        var text = match[2];
        if (text in squiffy.story.section.passages) {
            text = squiffy.story.section.passages[text].text;
        }
        else if (text in squiffy.story.sections) {
            text = squiffy.story.sections[text].text;
        }
        var stripParags = /^<p>(.*)<\/p>$/;
        var stripParagsMatch = stripParags.exec(text);
        if (stripParagsMatch) {
            text = stripParagsMatch[1];
        }
        var $labels = squiffy.ui.output.find('.squiffy-label-' + label);
        $labels.fadeOut(1000, function() {
            $labels.html(squiffy.ui.processText(text));
            $labels.fadeIn(1000, function() {
                squiffy.story.save();
            });
        });
    };

    squiffy.story.go = function(section) {
        squiffy.set('_transition', null);
        newSection();
        squiffy.story.section = squiffy.story.sections[section];
        if (!squiffy.story.section) return;
        squiffy.set('_section', section);
        setSeen(section);
        var master = squiffy.story.sections[''];
        if (master) {
            squiffy.story.run(master);
            squiffy.ui.write(master.text);
        }
        squiffy.story.run(squiffy.story.section);
        // The JS might have changed which section we're in
        if (squiffy.get('_section') == section) {
            squiffy.set('_turncount', 0);
            squiffy.ui.write(squiffy.story.section.text);
            squiffy.story.save();
        }
    };

    squiffy.story.run = function(section) {
        if (section.clear) {
            squiffy.ui.clearScreen();
        }
        if (section.attributes) {
            processAttributes(section.attributes);
        }
        if (section.js) {
            section.js();
        }
    };

    squiffy.story.passage = function(passageName) {
        var passage = squiffy.story.section.passages[passageName];
        if (!passage) return;
        setSeen(passageName);
        var masterSection = squiffy.story.sections[''];
        if (masterSection) {
            var masterPassage = masterSection.passages[''];
            if (masterPassage) {
                squiffy.story.run(masterPassage);
                squiffy.ui.write(masterPassage.text);
            }
        }
        var master = squiffy.story.section.passages[''];
        if (master) {
            squiffy.story.run(master);
            squiffy.ui.write(master.text);
        }
        squiffy.story.run(passage);
        squiffy.ui.write(passage.text);
        squiffy.story.save();
    };

    var processAttributes = function(attributes) {
        attributes.forEach(function (attribute) {
            if (startsWith(attribute, '@replace ')) {
                replaceLabel(attribute.substring(9));
            }
            else {
                setAttribute(attribute);
            }
        });
    };

    squiffy.story.restart = function() {
        if (squiffy.ui.settings.persist && window.localStorage) {
            var keys = Object.keys(localStorage);
            jQuery.each(keys, function (idx, key) {
                if (startsWith(key, squiffy.story.id)) {
                    localStorage.removeItem(key);
                }
            });
        }
        else {
            squiffy.storageFallback = {};
        }
        if (squiffy.ui.settings.scroll === 'element') {
            squiffy.ui.output.html('');
            squiffy.story.begin();
        }
        else {
            location.reload();
        }
    };

    squiffy.story.save = function() {
        squiffy.set('_output', squiffy.ui.output.html());
    };

    squiffy.story.load = function() {
        var output = squiffy.get('_output');
        if (!output) return false;
        squiffy.ui.output.html(output);
        currentSection = jQuery('#' + squiffy.get('_output-section'));
        squiffy.story.section = squiffy.story.sections[squiffy.get('_section')];
        var transition = squiffy.get('_transition');
        if (transition) {
            eval('(' + transition + ')()');
        }
        return true;
    };

    var setSeen = function(sectionName) {
        var seenSections = squiffy.get('_seen_sections');
        if (!seenSections) seenSections = [];
        if (seenSections.indexOf(sectionName) == -1) {
            seenSections.push(sectionName);
            squiffy.set('_seen_sections', seenSections);
        }
    };

    squiffy.story.seen = function(sectionName) {
        var seenSections = squiffy.get('_seen_sections');
        if (!seenSections) return false;
        return (seenSections.indexOf(sectionName) > -1);
    };

    squiffy.ui = {};

    var currentSection = null;
    var screenIsClear = true;
    var scrollPosition = 0;

    var newSection = function() {
        if (currentSection) {
            disableLink(jQuery('.squiffy-link', currentSection));
        }
        var sectionCount = squiffy.get('_section-count') + 1;
        squiffy.set('_section-count', sectionCount);
        var style = 'display:none;';
        var id = 'squiffy-section-' + sectionCount;
        currentSection = jQuery('<div/>', {
            style : style,
            id: id,
        }).appendTo(squiffy.ui.output).slideDown('slow' , function(){$('html,body').animate({scrollTop: $(this).offset().top - 100}, 3000, 'easeInOutExpo');});
        squiffy.set('_output-section', id);
    };

    squiffy.ui.write = function(text) {
        screenIsClear = false;
        scrollPosition = squiffy.ui.output.height();
        currentSection.html(squiffy.ui.processText(text));
        squiffy.ui.scrollToEnd();
    };

    squiffy.ui.clearScreen = function() {
        squiffy.ui.output.html('');
        screenIsClear = true;
        newSection();
    };

    squiffy.ui.scrollToEnd = function() {
        var scrollTo, currentScrollTop, distance, duration;
        if (squiffy.ui.settings.scroll === 'element') {
            scrollTo = squiffy.ui.output[0].scrollHeight - squiffy.ui.output.height();
            currentScrollTop = squiffy.ui.output.scrollTop();
            if (scrollTo > currentScrollTop) {
                distance = scrollTo - currentScrollTop;
                duration = distance / 0.4;
                squiffy.ui.output.stop().animate({ scrollTop: scrollTo }, duration);
            }
        }
        else {
            scrollTo = scrollPosition;
            currentScrollTop = Math.max(jQuery('body').scrollTop(), jQuery('html').scrollTop());
            if (scrollTo > currentScrollTop) {
                var maxScrollTop = jQuery(document).height() - jQuery(window).height();
                if (scrollTo > maxScrollTop) scrollTo = maxScrollTop;
                distance = scrollTo - currentScrollTop;
                duration = distance / 0.5;
                jQuery('body,html').stop().animate({ scrollTop: scrollTo }, duration);
            }
        }
    };

    squiffy.ui.processText = function(text) {
        function process(text, data) {
            var containsUnprocessedSection = false;
            var open = text.indexOf('{');
            var close;

            if (open > -1) {
                var nestCount = 1;
                var searchStart = open + 1;
                var finished = false;

                while (!finished) {
                    var nextOpen = text.indexOf('{', searchStart);
                    var nextClose = text.indexOf('}', searchStart);

                    if (nextClose > -1) {
                        if (nextOpen > -1 && nextOpen < nextClose) {
                            nestCount++;
                            searchStart = nextOpen + 1;
                        }
                        else {
                            nestCount--;
                            searchStart = nextClose + 1;
                            if (nestCount === 0) {
                                close = nextClose;
                                containsUnprocessedSection = true;
                                finished = true;
                            }
                        }
                    }
                    else {
                        finished = true;
                    }
                }
            }

            if (containsUnprocessedSection) {
                var section = text.substring(open + 1, close);
                var value = processTextCommand(section, data);
                text = text.substring(0, open) + value + process(text.substring(close + 1), data);
            }

            return (text);
        }

        function processTextCommand(text, data) {
            if (startsWith(text, 'if ')) {
                return processTextCommand_If(text, data);
            }
            else if (startsWith(text, 'else:')) {
                return processTextCommand_Else(text, data);
            }
            else if (startsWith(text, 'label:')) {
                return processTextCommand_Label(text, data);
            }
            else if (/^rotate[: ]/.test(text)) {
                return processTextCommand_Rotate('rotate', text, data);
            }
            else if (/^sequence[: ]/.test(text)) {
                return processTextCommand_Rotate('sequence', text, data);
            }
            else if (text in squiffy.story.section.passages) {
                return process(squiffy.story.section.passages[text].text, data);
            }
            else if (text in squiffy.story.sections) {
                return process(squiffy.story.sections[text].text, data);
            }
            return squiffy.get(text);
        }

        function processTextCommand_If(section, data) {
            var command = section.substring(3);
            var colon = command.indexOf(':');
            if (colon == -1) {
                return ('{if ' + command + '}');
            }

            var text = command.substring(colon + 1);
            var condition = command.substring(0, colon);
			condition = condition.replace("<", "&lt;");
            var operatorRegex = /([\w ]*)(=|&lt;=|&gt;=|&lt;&gt;|&lt;|&gt;)(.*)/;
            var match = operatorRegex.exec(condition);

            var result = false;

            if (match) {
                var lhs = squiffy.get(match[1]);
                var op = match[2];
                var rhs = match[3];

                if (op == '=' && lhs == rhs) result = true;
                if (op == '&lt;&gt;' && lhs != rhs) result = true;
                if (op == '&gt;' && lhs > rhs) result = true;
                if (op == '&lt;' && lhs < rhs) result = true;
                if (op == '&gt;=' && lhs >= rhs) result = true;
                if (op == '&lt;=' && lhs <= rhs) result = true;
            }
            else {
                var checkValue = true;
                if (startsWith(condition, 'not ')) {
                    condition = condition.substring(4);
                    checkValue = false;
                }

                if (startsWith(condition, 'seen ')) {
                    result = (squiffy.story.seen(condition.substring(5)) == checkValue);
                }
                else {
                    var value = squiffy.get(condition);
                    if (value === null) value = false;
                    result = (value == checkValue);
                }
            }

            var textResult = result ? process(text, data) : '';

            data.lastIf = result;
            return textResult;
        }

        function processTextCommand_Else(section, data) {
            if (!('lastIf' in data) || data.lastIf) return '';
            var text = section.substring(5);
            return process(text, data);
        }

        function processTextCommand_Label(section, data) {
            var command = section.substring(6);
            var eq = command.indexOf('=');
            if (eq == -1) {
                return ('{label:' + command + '}');
            }

            var text = command.substring(eq + 1);
            var label = command.substring(0, eq);

            return '<span class="squiffy-label-' + label + '">' + process(text, data) + '</span>';
        }

        function processTextCommand_Rotate(type, section, data) {
            var options;
            var attribute = '';
            if (section.substring(type.length, type.length + 1) == ' ') {
                var colon = section.indexOf(':');
                if (colon == -1) {
                    return '{' + section + '}';
                }
                options = section.substring(colon + 1);
                attribute = section.substring(type.length + 1, colon);
            }
            else {
                options = section.substring(type.length + 1);
            }
            var rotation = rotate(options.replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
            if (attribute) {
                squiffy.set(attribute, rotation[0]);
            }
            return '<a class="squiffy-link" data-' + type + '="' + rotation[1] + '" data-attribute="' + attribute + '" role="link">' + rotation[0] + '</a>';
        }

        var data = {
            fulltext: text
        };
        return process(text, data);
    };

    squiffy.ui.transition = function(f) {
        squiffy.set('_transition', f.toString());
        f();
    };

    squiffy.storageFallback = {};

    squiffy.set = function(attribute, value) {
        if (typeof value === 'undefined') value = true;
        if (squiffy.ui.settings.persist && window.localStorage) {
            localStorage[squiffy.story.id + '-' + attribute] = JSON.stringify(value);
        }
        else {
            squiffy.storageFallback[attribute] = JSON.stringify(value);
        }
        squiffy.ui.settings.onSet(attribute, value);
    };

    squiffy.get = function(attribute) {
        var result;
        if (squiffy.ui.settings.persist && window.localStorage) {
            result = localStorage[squiffy.story.id + '-' + attribute];
        }
        else {
            result = squiffy.storageFallback[attribute];
        }
        if (!result) return null;
        return JSON.parse(result);
    };

    var startsWith = function(string, prefix) {
        return string.substring(0, prefix.length) === prefix;
    };

    var rotate = function(options, current) {
        var colon = options.indexOf(':');
        if (colon == -1) {
            return [options, current];
        }
        var next = options.substring(0, colon);
        var remaining = options.substring(colon + 1);
        if (current) remaining += ':' + current;
        return [next, remaining];
    };

    var methods = {
        init: function (options) {
            var settings = jQuery.extend({
                scroll: 'body',
                persist: true,
                restartPrompt: true,
                onSet: function (attribute, value) {}
            }, options);

            squiffy.ui.output = this;
            squiffy.ui.restart = jQuery(settings.restart);
            squiffy.ui.settings = settings;

            if (settings.scroll === 'element') {
                squiffy.ui.output.css('overflow-y', 'auto');
            }

            initLinkHandler();
            squiffy.story.begin();

            return this;
        },
        get: function (attribute) {
            return squiffy.get(attribute);
        },
        set: function (attribute, value) {
            squiffy.set(attribute, value);
        },
        restart: function () {
            //if (!squiffy.ui.settings.restartPrompt || confirm('Are you sure you want to restart the story? All progress will be lost.')) {
                squiffy.story.restart();
            //}
        }
    };

    jQuery.fn.squiffy = function (methodOrOptions) {
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions]
                .apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof methodOrOptions === 'object' || ! methodOrOptions) {
            return methods.init.apply(this, arguments);
        } else {
            jQuery.error('Method ' +  methodOrOptions + ' does not exist');
        }
    };
})();

var get = squiffy.get;
var set = squiffy.set;


squiffy.story.start = 'setvariables';
squiffy.story.id = '75486b01cb';
squiffy.story.sections = {
	'setvariables': {
		'text': "{start}",
		'attributes': ["SC = 0","PC = 0", "fail = 0","not salarawin","not parentswin","not tie","not carkiss",
            "not greetingfail","antonia","not clothes","not compliment","not samstory","not sammad","not samclothes",
            "not interrupt","hisao","not tease","not roof","not samhelp","not tool","not drink2","not accident",
            "not accident_involve","not chopsticks","not spoon"],
		'passages': {
		},
	},
	'start': {
		'text': "" +
        "<article id=\"cb01\" class=\"content-block is-active\">" +
            "<div class=\"wrapper textwrap\">" +
                "<header class=\"slideInUp\"><h1>Kapitel 1: Ankunft</h1></header>" +
                "<section>" +
                    "<p class=\"tr__para slideInUp slideInUp2\">" +
                        "Alice was beginning to get very tired of sitting by her sister on the bank, and of" +
                        "having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no" +
                        "pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'"+
                    "</p>" +
                    "<p class=\"tr__para slideInUp slideInUp3\">" +
                        "So she was considering in her own mind (as well as she could, for the hot day made her feel very " +
                        "sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and" +
                        "picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her." +
                    "</p>" +
                    "<p class=\"tr__para slideInUp slideInUp4\">" +
                        "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear " +
                        "the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her " +
                        "that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took " +
                        "a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across " +
                        "her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with " +
                        "curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge." +
                    "</p>" +
                    "<p class=\"tr__para slideInUp slideInUp5\">" +
                        "In another moment down went Alice after it, never once considering how in the world she was to get out again." +
                    "</p>" +
                    "<p class=\"tr__para slideInUp slideInUp5\">" +
                        "The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not" +
                        " a moment to think about stopping herself before she found herself falling down a very deep well." +
                    "</p>" +
                    "<div class=\"btnwrap slideInUp slideInUp4\">" +
                        "<a class=\"squiffy-link link-section\" data-section=\"Carkiss yes\" role=\"link\" tabindex=\"0\">Carkiss yes</a>" +
                        "<a class=\"squiffy-link link-section\" data-section=\"Carkiss no\" role=\"link\" tabindex=\"0\">Carkiss no</a>" +
                    "</div>" +
                "</section>" +
            "</div>" +
            "<div class=\"imgwrap slideInUp slideInUp5\">" +
                "<a href=\"#\" data-featherlight=\"img/story/animals.jpeg\">" +
                    "<img src=\"img/story/animals.jpeg\" class=\"img-responsive\" />" +
                "</a>" +
            "</div>" +
        "</article>",
		'passages': {
		},
	},
	'Carkiss yes': {
		'text': "" +
        "<article id=\"slide01\" class=\"slide qt\">" +
            "<div class=\"bcg\"></div>" +
            "<div class=\"wrapper\">" +
                //"<header class=\"slideInUp\"><h1>RENDER #1</h1></header>" +
                 "<section>" +
                    "<blockquote class=\"tr__quote\">" +
                        "<p class=\"tr__quote__para\">" +
                            "<span class=\"fa fa-quote-left\"></span>" +
                            " Alice was beginning to get very tired of sitting by her sister on the bank, and of" +
                            "having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no" +
                            "pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations? '"+
                            "<span class=\"fa fa-quote-right\"></span>" +
                        "</p>" +
                    "</blockquote>" +
                "</section>" +
            "</div>" +
        "</article>" +
        "<article id=\"cb02\" class=\"content-block\">" +
            "<div class=\"imgwrap slideInUp slideInUp5\">" +
                "<a href=\"#\" data-featherlight=\"img/story/carkiss.gif\">" +
                    "<img src=\"img/story/carkiss.gif\" class=\"img-responsive\" />" +
                "</a>" +
            "</div>" +
            "<div class=\"wrapper textwrap right\">" +
                "<header class=\"slideInUp\"></header>" +
                "<section>" +
                    "<p class=\"tr__para slideInUp\">Carkisstext YES mit zusätzlichem Bild</p>" +
                    "{Carkiss more}" +
                "</section>" +
            "</div>" +
        "</article>",
		'attributes': ["carkiss"],
		'passages': {
		},
	},
	'Carkiss no': {
		'text': "" +
       "<article id=\"slide01\" class=\"slide gt\">" +
            "<div class=\"bcg\"></div>" +
            "<div class=\"wrapper\">" +
                //"<header class=\"slideInUp\"><h1>RENDER #1</h1></header>" +
                "<section>" +
                    "<blockquote class=\"tr__quote\">" +
                        "<p class=\"tr__quote__para\">" +
                            "<span class=\"fa fa-quote-left\"></span>" +
                            " Alice was beginning to get very tired of sitting by her sister on the bank, and of" +
                            "having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no" +
                            "pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations? '"+
                            "<span class=\"fa fa-quote-right\"></span>" +
                        "</p>" +
                    "</blockquote>" +
                "</section>" +
            "</div>" +
        "</article>" +
        "<article id=\"cb02\" class=\"content-block\">" +
            "<div class=\"imgwrap slideInUp slideInUp5\">" +
                "<a href=\"#\" data-featherlight=\"img/story/animals.jpeg\">" +
                    "<img src=\"img/story/animals.jpeg\" class=\"img-responsive\" />" +
                "</a>" +
            "</div>" +
            "<div class=\"wrapper textwrap right\">" +
                "<header class=\"slideInUp\"></header>" +
                "<section>" +
                    "<p class=\"tr__para slideInUp\">Carkisstext NO mit zusätzlichem Bild</p>" +
                    "{Carkiss more}" +
                "</section>" +
            "</div>" +
        "</article>",
		'passages': {
		},
	},
	'Carkiss more': {
		'text': "" +
        "<p class=\"tr__para slideInUp slideInUp2\">" +
            "Alice was beginning to get very tired of sitting by her sister on the bank, and of" +
            "having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no" +
            "pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'"+
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp3\">" +
            "So she was considering in her own mind (as well as she could, for the hot day made her feel very " +
            "sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and" +
            "picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her." +
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp4\">" +
            "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear " +
            "the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her " +
            "that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took " +
            "a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across " +
            "her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with " +
            "curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge." +
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp5\">" +
            "In another moment down went Alice after it, never once considering how in the world she was to get out again." +
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp5\">" +
            "The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not" +
            " a moment to think about stopping herself before she found herself falling down a very deep well." +
        "</p>" +
        "<div class=\"btnwrap slideInUp slideInUp4\">" +
            "<a class=\"squiffy-link link-section\" data-section=\"Greetingfail yes\" role=\"link\" tabindex=\"0\">Greetingfail yes</a>" +
            "<a class=\"squiffy-link link-section\" data-section=\"Greetingfail no\" role=\"link\" tabindex=\"0\">Greetingfail no</a>" +
        "</div>",
		'passages': {
		},
    },
    'Greetingfail yes': {
        'text': "" +
        "<article id=\"slide02\" class=\"slide fs\">" +
            "<div class=\"bcg\"></div>" +
            "<div class=\"wrapper\">" +
                "<header class=\"slideInUp\"><h1>RENDER #2</h1></header>" +
                "<section></section>" +
            "</div>" +
        " </article>" +
        "<article id=\"cb03\" class=\"content-block\">" +
            "<div class=\"wrapper textwrap\">" +
                "<header class=\"slideInUp\"></header>" +
                "<section>" +
                "<p class=\"tr__para slideInUp\">Greetingfail YES mit zusätzlichem Bild</p>" +
                "{Greetingfail more}" +
                "</section>" +
            "</div>" +
            "<div class=\"imgwrap slideInUp slideInUp5\">" +
                "<a href=\"#\" data-featherlight=\"img/story/animals.jpeg\">" +
                    "<img src=\"img/story/animals.jpeg\" class=\"img-responsive\" />" +
                "</a>" +
            "</div>" +
        "</article>",
        'attributes': ["greetingfail"],
        'passages': {
        },
    },
    'Greetingfail no': {
        'text': "" +
        "<article id=\"slide02\" class=\"slide fs\">" +
            "<div class=\"bcg\"></div>" +
            "<div class=\"wrapper\">" +
                "<header class=\"slideInUp\"><h1>RENDER #2</h1></header>" +
                "<section></section>" +
            "</div>" +
        " </article>" +
        "<article id=\"cb03\" class=\"content-block\">" +
            "<div class=\"wrapper textwrap\">" +
                "<header class=\"slideInUp\"></header>" +
                "<section>" +
                    "<p class=\"tr__para slideInUp\">Greetingfail NO mit zusätzlichem Bild</p>" +
                    "{Greetingfail more}" +
                "</section>" +
            "</div>" +
            "<div class=\"imgwrap slideInUp slideInUp5\">" +
                "<a href=\"#\" data-featherlight=\"img/story/animals.jpeg\">" +
                    "<img src=\"img/story/animals.jpeg\" class=\"img-responsive\" />" +
                "</a>" +
            "</div>" +
        "</article>",
        'passages': {
        },
    },
    'Greetingfail more': {
        'text': "" +
        "<p class=\"tr__para slideInUp slideInUp2\">" +
            "Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look " +
            "about her and to wonder what was going to happen next. First, she tried to look down and make out what she was " +
            "coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they " +
            "were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took " +
            "down a jar from one of the shelves as she passed; it was labelled 'ORANGE MARMALADE', but to her great " +
            "disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to " +
            "put it into one of the cupboards as she fell past it."+
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp3\">" +
            "'Well!' thought Alice to herself, 'after such a fall as this, I shall think nothing of tumbling down stairs! " +
            "How brave they'll all think me at home! Why, I wouldn't say anything about it, even if I fell off the top of the " +
            "house!' (Which was very likely true.)" +
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp4\">" +
            "Down, down, down. Would the fall never come to an end! 'I wonder how many miles I've fallen by this time?' " +
            "she said aloud. 'I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand " +
            "miles down, I think—' (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, " +
            "and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, " +
            "still it was good practice to say it over) '—yes, that's about the right distance—but then I wonder what Latitude " +
            "or Longitude I've got to?' (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)" +
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp5\">" +
            "Presently she began again. 'I wonder if I shall fall right through the earth! How funny it'll seem to come " +
            "out among the people that walk with their heads downward! The Antipathies, I think—' (she was rather glad there " +
            "was no one listening, this time, as it didn't sound at all the right word) '—but I shall have to ask them what the " +
            "name of the country is, you know. Please, Ma'am, is this New Zealand or Australia?' (and she tried to curtsey as " +
            "she spoke—fancy curtseying as you're falling through the air! Do you think you could manage it?) 'And what an " +
            "ignorant little girl she'll think me for asking! No, it'll never do to ask: perhaps I shall see it written up somewhere.'" +
        "</p>" +
        "<p class=\"tr__para slideInUp slideInUp5\">" +
            "Down, down, down. There was nothing else to do, so Alice soon began talking again. 'Dinah'll miss me very " +
            "much to-night, I should think!' (Dinah was the cat.) 'I hope they'll remember her saucer of milk at tea-time. " +
            "Dinah my dear! I wish you were down here with me! There are no mice in the air, I'm afraid, but you might catch " +
            "a bat, and that's very like a mouse, you know. But do cats eat bats, I wonder?' And here Alice began to get rather " +
            "sleepy, and went on saying to herself, in a dreamy sort of way, 'Do cats eat bats? Do cats eat bats?' and sometimes, " +
            "'Do bats eat cats?' for, you see, as she couldn't answer either question, it didn't much matter which way she put " +
            "it. She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, " +
            "and saying to her very earnestly, 'Now, Dinah, tell me the truth: did you ever eat a bat?' when suddenly, thump! " +
            "thump! down she came upon a heap of sticks and dry leaves, and the fall was over." +
        "</p>" +
        "<div class\"slideInUp slideInUp4\">" +
            "<a class=\"squiffy-link link-section\" data-section=\"Antonia_pre\" role=\"link\" tabindex=\"0\">Antonia</a>" +
            "<a class=\"squiffy-link link-section\" data-section=\"Hisao_pre\" role=\"link\" tabindex=\"0\">Hisao</a>" +
        "</div>",
        'passages': {
        },
    },
}
})();
