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
                    currentSection.append('<hr/>');
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
                currentSection.append('<hr/>');
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
        var id = 'squiffy-section-' + sectionCount;
        currentSection = jQuery('<div/>', {
            id: id,
        }).appendTo(squiffy.ui.output);
        squiffy.set('_output-section', id);
    };

    squiffy.ui.write = function(text) {
        screenIsClear = false;
        scrollPosition = squiffy.ui.output.height();
        currentSection.append(jQuery('<div/>').html(squiffy.ui.processText(text)));
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
            if (!squiffy.ui.settings.restartPrompt || confirm('Are you sure you want to restart?')) {
                squiffy.story.restart();
            }
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
squiffy.story.id = '463807b14b';
squiffy.story.sections = {
	'setvariables': {
		'text': "{start}",
		'attributes': ["SC = 0","PC = 0","not salarawin","not parentswin","not tie","not carkiss","not greetingfail","not antonia","not clothes","not compliment","not samstory","not sammad","not interrupt","not hisao","not tease","not roof","not samhelp","not tool","not drink2"],
		'passages': {
		},
	},
	'start': {
		'text': "<h1>Kapitel 1: Ankunft</h1>\n<span id=\"ch1\"></span><p>\nSalara fahren im schicken Schlitten zur Residenz<br/>\nUnterhalten sich währenddessen über A/H, die not-to-do Liste gegenüber A etc<br/>\nSam flauscht sich ran</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Carkiss yes\" role=\"link\" tabindex=\"0\">Carkiss yes</a> <a class=\"squiffy-link link-section\" data-section=\"Carkiss no\" role=\"link\" tabindex=\"0\">Carkiss no</a></p>",
		'passages': {
		},
	},
	'Carkiss yes': {
		'text': "<p>Carkisstext YES mit zusätzlichem <a class=\"squiffy-link link-passage\" data-passage=\"Bildlink\" role=\"link\" tabindex=\"0\">Bildlink</a></p>\n<p>{Carkiss more}</p>",
		'attributes': ["carkiss"],
		'passages': {
			'Bildlink': {
				'text': "<p><img src=\"http://placekitten.com/500/200\" class=\"img-responsive\" /></p>",
			},
		},
	},
	'Carkiss no': {
		'text': "<p>Carkisstext NO mit zusätzlichem <a class=\"squiffy-link link-passage\" data-passage=\"Bildlink\" role=\"link\" tabindex=\"0\">Bildlink</a></p>\n<p>{Carkiss more}</p>",
		'passages': {
			'Bildlink': {
				'text': "<p><img src=\"http://placekitten.com/200/300\" class=\"img-responsive\" /></p>",
			},
		},
	},
	'Carkiss more': {
		'text': "<p>Salara erreichen Residenz, steigen aus, gehen rein <br/>\nH ist im Foyer und labert am Telefon<br/>\nA ist noch unterwegs (Küche/draußen)<br/>\nSalara warten darauf dass H Zeit hat<br/>\nWährrenddessen kommt Akito und flauscht Lara an<br/>\nLara will dazu auch noch Vasen betouchen<br/>\n<br/>\nH fertig mit Telefonat, umarmt Sam<br/></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Greetingfail yes\" role=\"link\" tabindex=\"0\">Greetingfail yes</a> <a class=\"squiffy-link link-section\" data-section=\"Greetingfail no\" role=\"link\" tabindex=\"0\">Greetingfail no</a> </p>",
		'passages': {
		},
	},
	'Greetingfail yes': {
		'text': "<p>H will eigentlich nur Hand schütteln<br/>\nLara verbeugt sich aber zuvor und macht einen voll auf Japaner<br/>\nH amüsiert </p>\n<p>{Greetingfail more}</p>",
		'attributes': ["greetingfail"],
		'passages': {
		},
	},
	'Greetingfail no': {
		'text': "<p>Lara wartet ab und H reicht ihr die Hand zur Begrüßung<br/>\nSchütteln die Hand</p>\n<p>{Greetingfail more}</p>",
		'passages': {
		},
	},
	'Greetingfail more': {
		'text': "<p>H fragt wie Flug war <br/>\nH scherzt rum wegen #Larakito<br/>\n<br/>\nA kommt hinzu und Katze ist wech<br/>\nA begrüßt Salara überschwänglich und labert los was Sache ist<br/>\nA schlägt vor Salara soll sich doch erstmal ausruhen und aufs Zimmer gehen <br/>\nSie macht H dann zur Schnecke wegen der Beleuchtung<br/></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Antonia_pre\" role=\"link\" tabindex=\"0\">Antonia</a> <a class=\"squiffy-link link-section\" data-section=\"Hisao_pre\" role=\"link\" tabindex=\"0\">Hisao</a></p>",
		'passages': {
		},
	},
	'Antonia_pre': {
		'text': "<p>Resting sounds good.<br/>\nA sagt sie muss sich noch um etwas kümmern, dann lässt sie nach Salara rufen, wenn sie Zeit hat <br/>\nGeräusch aus der Küche lässt sich davonwuseln<br/>\n&quot;Sam du weißt wo es lang geht. Du machst das schon.&quot;</p>\n<p><a class=\"squiffy-link link-section ch2\" data-section=\"Antonia\" role=\"link\" tabindex=\"0\">Kapitel 2</a></p>",
		'passages': {
		},
	},
	'Hisao_pre': {
		'text': "<p>Lara bietet sich sogleich an beim Vorhaben zu helfen <br>\nSam: Sweetie <em>hust</em> what are you doing?! <_< <br>\nH geht mit Salara raus um Beleuchtung abzunehmen <br>\nSalara zieht sich wieder an/oder ist noch angezogen?, Sam ist whiny </p>\n<p><a class=\"squiffy-link link-section ch2\" data-section=\"Hisao\" role=\"link\" tabindex=\"0\">Kapitel 2</a></p>",
		'passages': {
		},
	},
	'Antonia': {
		'text': "<p><h1>Kapitel 2: A</h1>\n<span id=\"ch2\"></span></p>\n<p>Salara gehen auf ihre Zimmer, die verbunden sind<br>\nAkito folgt ihnen und beglotzt alles<br>\nSalara labern über die 2 Zimmer Sache<br>\n<br>\n{if greetingfail:\nSam neckt Lara über den GREETINGFAIL den sie mit H hatte<br>\n}\nSam geht erstmal duschen, Lara packt Tasche aus<br>\nFührt Katzenmonolog über den Ring<br>\nBringt dann Sam Handtuch ins Bad, gehen zusammen zurück ins Zimmer<br>\nSam öffnet ihren Koffer und erstes Katzendrama beginnt<br>\nSam bietet Lara ein Outfit fürs Dinner an.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Clothes yes\" role=\"link\" tabindex=\"0\">Clothes yes</a> <a class=\"squiffy-link link-section\" data-section=\"Clothes no\" role=\"link\" tabindex=\"0\">Clothes no</a> </p>",
		'attributes': ["antonia"],
		'passages': {
		},
	},
	'Clothes yes': {
		'text': "<p>Lara nimmt das Outfit an<br>\nGeht auch duschen und sich umziehen<br>\nWährend Lara duscht, kommt Sam rein und schminkt sich<br>\nSam rückt Laras Sachen zurecht</p>\n<p>{Clothes_Compliment_transition}</p>",
		'attributes': ["clothes","number1 = 1"],
		'passages': {
		},
	},
	'Clothes no': {
		'text': "<p>Lara lehnt das Outfit ab<br>\nSam nachsichtig weil Lara sich eh schon unwohl wegen Umgebung fühlt etc<br>\nLara holt sich frische Kleidung und geht duschen<br>\nWährend Lara duscht, kommt Sam rein und schminkt sich<br>\nSam rückt Laras Sachen zurecht <br><br></p>\n<p>{Clothes_Compliment_transition}</p>",
		'attributes': ["number1 = 0"],
		'passages': {
		},
	},
	'Clothes_Compliment_transition': {
		'text': "<p>A schickt Angestellten, der sie in ihr &quot;Büro&quot; bringt, wo die Glamourshots an den Wänden hängen<br>\nLara schaut sich diese gleich mal genauer an <br>\nSam ist das voll peinlich und sie versucht sie davon abzuhalten <br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Compliment yes\" role=\"link\" tabindex=\"0\">Compliment yes</a> <a class=\"squiffy-link link-section\" data-section=\"Compliment_check\" role=\"link\" tabindex=\"0\">Compliment no</a> </p>",
		'passages': {
		},
	},
	'Compliment yes': {
		'text': "<p>Lara macht ein Kompliment über A<br>\nDie kommt natürlich gerade rechtzeitig rein um das mitzubekommen<br>\nSam angenervt und mürrisch darüber<br>\nA begeistert, nutzt das gleich Lara neu einkleiden zu können und scheucht Salara zu ihrem begehbaren Kleiderschrank<br></p>\n<p>{Compliment_Samstory_transition}</p>",
		'attributes': ["compliment","number2 = 0"],
		'passages': {
		},
	},
	'Compliment_check': {
		'text': "",
		'attributes': ["number2 = 1"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var res = "ResultA_" + nr1 + nr2;
			if(res == "ResultA_11") {
			    squiffy.story.go(res);
			}
			else {
			    squiffy.story.go("Compliment no");
			}
		},
		'passages': {
		},
	},
	'Compliment no': {
		'text': "<p>Lara verkneift sich einen Kompliment über A<br>\nA kommt herein und begrüßt die beiden noch einmal<br>\nKommentiert Lara&#39;s Aufzug und entscheidet, dass sie was besseres tragen muss<br>\nScheucht Salara rüber zu ihrem begehbaren Kleiderschrank</p>\n<p>{Compliment_Samstory_transition}</p>",
		'passages': {
		},
	},
	'Compliment_Samstory_transition': {
		'text': "<p>A fängt an Kleidung rauszuholen und will Lara an die Wäsche<br>\nFängt an von einer &quot;Sammie&quot; Anekdote zu labern<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Samstory yes\" role=\"link\" tabindex=\"0\">Samstory yes</a> <a class=\"squiffy-link link-section\" data-section=\"Samstory no\" role=\"link\" tabindex=\"0\">Samstory no</a></p>",
		'passages': {
		},
	},
	'Samstory yes': {
		'text': "",
		'attributes': ["samstory","number3 = 0"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var nr3 = squiffy.get("number3");
			var res = "ResultA_" + nr1 + nr2 + nr3;
			squiffy.story.go(res);
		},
		'passages': {
		},
	},
	'Samstory no': {
		'text': "",
		'attributes': ["number3 = 1"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var nr3 = squiffy.get("number3");
			var res = "ResultA_" + nr1 + nr2 + nr3;
			squiffy.story.go(res);
		},
		'passages': {
		},
	},
	'Samstory more': {
		'text': "<p>{if samstory:\nLara sagt nix oder fragt nach der Anekdote<br>\nA erzählt die &quot;Sammie&quot; Anekdote<br>\n}\n{else:\nLara kommt Sam verbal zur Hilfe<br>\nHält A ab die Anekdote zu erzählen<br>\n}</p>",
		'passages': {
		},
	},
	'ResultA_101': {
		'text': "<p>{Samstory more}</p>\n<p>Sam scheucht A aus der Kammer<br/>\nmürrisch wegen As Kritik an Sams Wahl<br/>\naber <3 Lara im Kleid<br/>\nredet Lara gut zu <br/></p>\n<p>{Punsch transition}</p>",
		'js': function() {
			    squiffy.set("SC", 2);
			    squiffy.set("PC", 2);
			    
		},
		'passages': {
		},
	},
	'ResultA_100': {
		'text': "<p>{Samstory more}</p>\n<p>Sam und A diskutieren wegen Laras Kleidung<br/>\nLara : Do I have a say in this?<br/>\nA + Sam : No<br/></p>\n<p>{Punsch transition}</p>",
		'js': function() {
			    squiffy.set("SC", 1);
			    squiffy.set("PC", 3);
			    
		},
		'passages': {
		},
	},
	'ResultA_011': {
		'text': "<p>{Samstory more}</p>\n<p>Sam überzeugt A, Lara Privatspähre zu geben<br/>\nmacht Lara in Kleid Kompliment<br/>\nküsst sie ohne dass A es sieht<br/></p>\n<p>{Punsch transition}</p>",
		'js': function() {
			    squiffy.set("SC", 2);
			    squiffy.set("PC", 1);
			    
		},
		'passages': {
		},
	},
	'ResultA_010': {
		'text': "<p>{Samstory more}</p>\n<p>Sam zieht Lara BH aus und steckt sie in Kleid während A beschäftigt ist<br/>\nStichelei: wenigstens hat Lara jetzt was passendes an<br/></p>\n<p>{Punsch transition}</p>",
		'js': function() {
			    squiffy.set("SC", 1);
			    squiffy.set("PC", 2);
			    
		},
		'passages': {
		},
	},
	'ResultA_001': {
		'text': "<p>{Samstory more}</p>\n<p>Sam überzeugt A, Lara Privatspähre zu geben<br/>\nStichelei: Lara mag As Kleider eh mehr als was Sam anbot<br/></p>\n<p>{Punsch transition}</p>",
		'js': function() {
			    squiffy.set("SC", 1);
			    squiffy.set("PC", 2);
			    
		},
		'passages': {
		},
	},
	'ResultA_000': {
		'text': "<p>{Samstory more}</p>\n<p>Sam hilft Lara ins Kleid zu stecken<br/>\nStichelei: Lara&#39;s rags, Lara mag As Zeug eh mehr als Sams<br/>\nzieht Lara BH aus in Anwesenheit von A<br/>\nA kommentiert Lara&#39;s Oberweite wegen Model</p>\n<p>{Punsch transition}</p>",
		'attributes': ["sammad"],
		'js': function() {
			    squiffy.set("SC", 0);
			    squiffy.set("PC", 3);
			    
		},
		'passages': {
		},
	},
	'ResultA_11': {
		'text': "<p>Lara verkneift sich einen Kompliment über A<br>\nA kommt herein und begrüßt die beiden noch einmal<br>\nA will ihnen ihre neue Collection zeigen <br>\nScheucht Salara rüber zu ihrem begehbaren Kleiderschrank und zeigt Kleider aber zwingt Lara nicht zum umziehen<br></p>\n<p>{Punsch transition}</p>",
		'js': function() {
			    squiffy.set("SC", 2);
			    squiffy.set("PC", 0);
			    
		},
		'passages': {
		},
	},
	'Punsch transition': {
		'text': "<p>Nach dem Kleiderschrank Besuch, ruft A zum Punschtrinken auf<br>\nLässt diesen ins Wohnzimmer bringen, sagt in der Küche Bescheid<br>\nSetzen sich derweil schonmal hin und warten<br></p>\n<p>{if sammad:\nSam stützt sich auf Armlehne, weg von Lara <br>\nA redet über Punsch während sie auf ihn warten, über das tolle Wunderrezept<br>\nSam warnt Lara nicht vor dem Punsch\n}\n{else:\nA im Sessel, Salara auf Couch<br>\nA redet über Punsch während sie auf ihn warten, über das tolle Wunderrezept<br>\nSam flüstert Lara Warnungen zu\n}</p>\n<p>Fragen zu Sams Verhalten privat zum Thema, dass sie zusammen wohnen, zu Lara, zu Laras Dating Life, zu Sams Dating Life</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Interrupt yes\" role=\"link\" tabindex=\"0\">Interrupt yes</a> <a class=\"squiffy-link link-section\" data-section=\"Interrupt no\" role=\"link\" tabindex=\"0\">Interrupt no</a> </p>",
		'passages': {
		},
	},
	'Interrupt yes': {
		'text': "<p>Lara verlangt mehr Punsch zum Ablenken, und wie toll der doch ist, trinkt erste Fuhre auf Ex, und noch mehr und dann wird ihr schlecht<br>\nAngestellter kommt rein, informiert A über Essen<br>\nA beauftragt Sam sich um Lara zu kümmern (Glas Wasser blabla)<br>\nVerschwindet um nach Essen zu sehen<br>\n<br>\nSalara Fluffmoment, mit Entschuldigungen und Dinnerängsten<br>\nLaras Auftrag: Sam helfen A nicht an die Gurgel zu gehen</p>\n<p></br></br></br>\n��bergang Dinner</p>\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>",
		'attributes': ["interrupt"],
		'js': function() {
			    var sum = squiffy.get("SC") + 1;
			    squiffy.set("SC", sum);
			    var parents = squiffy.get("PC");
			    var salara = squiffy.get("SC");
			    if(salara > parents) {
			        squiffy.set("parentswin", false);
			        squiffy.set("salarawin", true);
			        squiffy.set("tie", false);
			    }
			    else if (salara < parents) {
			        squiffy.set("parentswin", true);
			        squiffy.set("salarawin", false);
			        squiffy.set("tie", false);
			    }
			    else if (salara == parents) {
			        squiffy.set("parentswin", false);
			        squiffy.set("salarawin", false);
			        squiffy.set("tie", true);
			    }
		},
		'passages': {
		},
	},
	'Interrupt no': {
		'text': "<p>A fängt an fiese peinliche Fragen zu stellen</br>\nLara veschluckt sich am Punsch und Runde wird abgebrochenAngestellter kommt rein, informiert A über Essen<br>\nA beauftragt Angestellten Lara ein Glas Wasser zu holen<br>\nVerschwindet um nach Essen zu sehen<br>\n<br>\nSalara Fluffmoment, mit Entschuldigungen und Dinnerängsten<br>\nLaras Auftrag: Sam helfen A nicht an die Gurgel zu gehen</p>\n<p></br></br></br>\nÜbergang Dinner</p>\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>",
		'js': function() {
			var parents = squiffy.get("PC");
			var salara = squiffy.get("SC");
			if(salara > parents) {
			    squiffy.set("parentswin", false);
			    squiffy.set("salarawin", true);
			    squiffy.set("tie", false);
			}
			else if (salara < parents) {
			    squiffy.set("parentswin", true);
			    squiffy.set("salarawin", false);
			    squiffy.set("tie", false);
			}
			else if (salara == parents) {
			    squiffy.set("parentswin", false);
			    squiffy.set("salarawin", false);
			    squiffy.set("tie", true);
			}
			    
		},
		'passages': {
		},
	},
	'Hisao': {
		'text': "<p><h1>Kapitel 2: H</h1>\n<span id=\"ch2\"></span></p>\n<p>Hisaotext bis zur ersten Entscheidung mit zusätzlichem <a class=\"squiffy-link link-passage\" data-passage=\"Bildlink\" role=\"link\" tabindex=\"0\">Bildlink</a></p>\n<p>{Hisao more}</p>",
		'attributes': ["hisao"],
		'passages': {
			'Bildlink': {
				'text': "<p><img src=\"http://placekitten.com/645/300\" class=\"img-responsive\" /></p>",
			},
		},
	},
	'Hisao more': {
		'text': "<p>Lara bietet sich sogleich an beim Vorhaben zu helfen <br>H geht mit Salara raus um Beleuchtung abzunehmen <br>Salara zieht sich wieder an/oder ist noch angezogen?, Sam ist whiny </p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Tease yes\" role=\"link\" tabindex=\"0\">Tease yes</a> <a class=\"squiffy-link link-section\" data-section=\"Tease no\" role=\"link\" tabindex=\"0\">Tease no</a></p>",
		'passages': {
		},
	},
	'Tease yes': {
		'text': "<p>TeasetextYES bis zur Dachentscheidung mit zusätzlichem <a class=\"squiffy-link link-passage\" data-passage=\"Bildlink\" role=\"link\" tabindex=\"0\">Bildlink</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Roof yes\" role=\"link\" tabindex=\"0\">Roof yes</a> <a class=\"squiffy-link link-section\" data-section=\"Roof no\" role=\"link\" tabindex=\"0\">Roof no</a></p>",
		'attributes': ["tease","number1 = 1"],
		'passages': {
			'Bildlink': {
				'text': "<p><img src=\"http://placekitten.com/645/300\" class=\"img-responsive\" /></p>",
			},
		},
	},
	'Tease no': {
		'text': "<p>TeasetextNO bis zur Dachentscheidung mit zusätzlichem <a class=\"squiffy-link link-passage\" data-passage=\"Bildlink\" role=\"link\" tabindex=\"0\">Bildlink</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Roof yes\" role=\"link\" tabindex=\"0\">Roof yes</a> <a class=\"squiffy-link link-section\" data-section=\"Roof no\" role=\"link\" tabindex=\"0\">Roof no</a></p>",
		'attributes': ["number1 = 0"],
		'passages': {
			'Bildlink': {
				'text': "<p><img src=\"http://placekitten.com/645/300\" class=\"img-responsive\" /></p>",
			},
		},
	},
	'Roof yes': {
		'text': "",
		'attributes': ["roof","number2 = 1"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var res = "ResultH_" + nr1 + nr2;
			if(res == "ResultH_10" || res == "ResultH_01") {
			    squiffy.story.go(res);
			}
			else {
			    squiffy.story.go("Roof more");
			}
		},
		'passages': {
		},
	},
	'Roof no': {
		'text': "",
		'attributes': ["number2 = 0"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var res = "ResultH_" + nr1 + nr2;
			if(res == "ResultH_10" || res == "ResultH_01") {
			    squiffy.story.go(res);
			}
			else {
			    squiffy.story.go("Roof more");
			}
		},
		'passages': {
		},
	},
	'Roof more': {
		'text': "<p>{if roof: \nLARA steigt aufs Dach<br>\nRooftextLARA bis zur ToolEntscheidung mit zusätzlichem <a class=\"squiffy-link link-passage\" data-passage=\"Bildlink\" role=\"link\" tabindex=\"0\">Bildlink</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Tool yes\" role=\"link\" tabindex=\"0\">Tool yes</a> <a class=\"squiffy-link link-section\" data-section=\"Tool no\" role=\"link\" tabindex=\"0\">Tool no</a>}\n{else: \nSAM steigt aufs Dach<br>\nRooftextSAM bis zur HelpEntscheidung mit zusätzlichem <a class=\"squiffy-link link-passage\" data-passage=\"Bildlink\" role=\"link\" tabindex=\"0\">Bildlink</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Help Sam\" role=\"link\" tabindex=\"0\">Help Sam</a> <a class=\"squiffy-link link-section\" data-section=\"Help Hisao\" role=\"link\" tabindex=\"0\">Help Hisao</a>}</p>",
		'passages': {
			'Bildlink': {
				'text': "<p><img src=\"http://placekitten.com/645/300\" class=\"img-responsive\" /></p>",
			},
		},
	},
	'Tool yes': {
		'text': "",
		'attributes': ["tool","number3 = 1"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var nr3 = squiffy.get("number3");
			var res = "ResultH_" + nr1 + nr2 + nr3;
			squiffy.story.go(res);
		},
		'passages': {
		},
	},
	'Tool no': {
		'text': "",
		'attributes': ["number3 = 0"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var nr3 = squiffy.get("number3");
			var res = "ResultH_" + nr1 + nr2 + nr3;
			squiffy.story.go(res);
		},
		'passages': {
		},
	},
	'Help Sam': {
		'text': "",
		'attributes': ["helpsam","number3 = 1"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var nr3 = squiffy.get("number3");
			var res = "ResultH_" + nr1 + nr2 + nr3;
			squiffy.story.go(res);
		},
		'passages': {
		},
	},
	'Help Hisao': {
		'text': "",
		'attributes': ["number3 = 0"],
		'js': function() {
			var nr1 = squiffy.get("number1");
			var nr2 = squiffy.get("number2");
			var nr3 = squiffy.get("number3");
			var res = "ResultH_" + nr1 + nr2 + nr3;
			squiffy.story.go(res);
			
		},
		'passages': {
		},
	},
	'ResultH_10': {
		'text': "<p>Sam steigt aufs Dach<br>\nSam fühlt sich unterstützt<br>\nSams Schnur steckt fest &amp; H braucht ganz kurz Hilfe mit Schnur bei sich<br>\nIst selbe Schnur, wenn sie H hilft, passiert was mit Sam und umgekehrt<br>\nWenn Schnur hakt bei Sam und H, verlangt Sam, dass ihr erst der Hammer gegeben wird, damit’s da oben vorangeht<br>\nwährend Lara H hilft danach, wirft Sam Schneeball, wenn sie schon fertig ist<br>\nSam: &quot;Lara!&quot;<br>\nLara dreht sich um &quot;Huh?&quot;klatsch<br>\nH: &quot;Sam, that&#39;s not nic-&quot; klatsch<br></p>\n<p><strong>H lädt zu einem Drink ein</strong></p>\n\n<p>H lobt Sam’s Einsatz<br>\nSam hält eine “I’m awesome” Anstoßrede<br>\nsüffeln ihren Drink</p>\n<p><strong>H bietet zweiten Drink an</strong></p>\n\n<p><a class=\"squiffy-link link-section\" data-section=\"Drink yes\" role=\"link\" tabindex=\"0\">Drink yes</a> <a class=\"squiffy-link link-section\" data-section=\"Drink no\" role=\"link\" tabindex=\"0\">Drink no</a></p>",
		'attributes': ["endResult = EndSzenarioH_10"],
		'passages': {
		},
	},
	'ResultH_01': {
		'text': "<p>Lara steigt aufs Dach<br>\nSam ist froh, wollte ohnehin nicht aufs Dach<br>\nSam is bissl besorgt um Lara<br>\nlara sagt, Schnur steckt fest<br>\nH sagt sie soll Hammer nehmen<br>\nSam will Hammer bringen<br>\nsteigt über Leiter auf  Vordach um ihn Lara zu geben, damit Lara sich nicht mehr als notwendig oben bewegen muss<br>\nLeiter rutscht weg wenn Sam auf Vordach steigt<br>\nSam taumelt auf rutschigem Vordach aber fängt sich<br>\nLara tritt auf losen Ziegel, wenn sie den Hammer abholen will<br>\nVerliert Halt, fällt<br>\nSam fängt sie, verliert dabei Balance wegen rutschigen Dach<br>\nfallen um, rutschen Vordach runter, landen im Schnee, Lara unten<br>\nSam haut eine cheesy pickup-line raus</p>\n<p><strong>H lädt zu einem Drink ein</strong></p>\n\n<p>H ist erfreut von Lara’s Einsatz bzgl. Hilfe &amp; Sam verteidigen<br>\nerwähnt was er schon so gehört hat von ihr<br>\nH macht “dadjokes”<br>\nsome booze for the bruise<br>\nSam facepalm =__=</p>\n<p><strong>H bietet zweiten Drink an</strong></p>\n\n<p><a class=\"squiffy-link link-section\" data-section=\"Drink yes\" role=\"link\" tabindex=\"0\">Drink yes</a> <a class=\"squiffy-link link-section\" data-section=\"Drink no\" role=\"link\" tabindex=\"0\">Drink no</a></p>",
		'attributes': ["endResult = EndSzenarioH_01"],
		'passages': {
		},
	},
	'ResultH_000': {
		'text': "<p>Sam jammert oben rum, setzt sich hin während sie auf Lara wartet<br>\nNachdem Lara H geholfen hat, steigt sie mit Hammer leiter hoch<br>\nLeiter rutscht weg, Sam steht nicht parat<br>\nLara greift nach Schnur, zieht Beleuchtung mit sich nach unten<br>\nSam tritt beim Nachgucken Ziegel los<br>\nZiegel fällt auf Lara</p>\n<p><strong>ZIMMER/VERARZTEN</strong><br>\nSam: Karma is a bitch, aber aufheiternder Scherz, dass es hätte schlimmer kommen können (Bezug auf andere Szenarien)<br>\nLara: &quot;you think your dad will be angry blabla&quot; <br>\nSam &quot;i think he&#39;s glad the stuff is down</p>\n\n<p><strong>VERARZTEN</strong><br>\nOffene Wunde Kopf (Ziegel)</p>\n\n<p><strong>H PLATZT MIT KATZE UND DRINK REIN</strong><br>\nH beruhigt Lara, dass Beleuchtung nicht so wichtig ist</p>\n\n<p><strong>DUSCHEN</strong><br>\nSam duscht, Lara legt sich zum Ausruhen aufs Bett<br>\nKatze kommt unter Bett hervor und flauscht sich dabei</p>\n\n<p><strong>SCHLAFEN</strong><br>\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!<br>\nSam vs Katze, Sam wins!, Sam gets cuddles</p>\n\n<p><strong>UMZIEHEN</strong><br>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an</p>\n\n<p><strong>DINNERTIME</strong></p>",
		'passages': {
		},
	},
	'ResultH_001': {
		'text': "<p>Sam jammert oben rum (Schnee, windig, rutschig, kalt, und Schnur hängt)<br>\nH sagt Hammer<br>\nLara bringt es hoch aufs Dach<br>\nSam steht bei Leiter<br>\nLeiter rutscht weg<br>\nSam greift nach Hand<br>\nLara zieht sich mit Sam’s Hilfe hoch<br>\nH hilft mit Leiter, sie kommen runter und brechen ab</p>\n<p><strong>H lädt zu einem Drink ein</strong></p>\n\n<p>H ist erfreut von Lara’s Einsatz bzgl. Hilfe &amp; Sam verteidigen<br>\nerwähnt was er schon so gehört hat von ihr<br>\nH beeindruckt von Laras Geschick<br>\nSam macht nudge-Andeutung<br>\nLara verschluckt sich</p>\n<p><strong>H bietet zweiten Drink an</strong></p>\n\n<p><a class=\"squiffy-link link-section\" data-section=\"Drink yes\" role=\"link\" tabindex=\"0\">Drink yes</a> <a class=\"squiffy-link link-section\" data-section=\"Drink no\" role=\"link\" tabindex=\"0\">Drink no</a></p>",
		'attributes': ["endResult = EndSzenarioH_001"],
		'passages': {
		},
	},
	'ResultH_111': {
		'text': "<p>Sam, genervt, wirft Hammer  hoch<br>\nLara versucht Hammer zu fangen, tritt auf Ziegel, abeglenkt<br>\nHammer trifft Lara am Kopf, fällt auf Vordach runter<br>\nH: “Armes Dach!”<br>\nLara fällt hitnerher<br>\nbricht durch Vordach durch<br>\nlandet auf Auto</p>\n<p><strong>ZIMMER/VERARZTEN</strong><br>\nSam betrübt, weil alles schief ging<br>\nSam entschuldigt sich bei Lara für Verhalten<br>\nLara entschuldigt sich auch</p>\n\n<p><strong>VERARZTEN</strong><br>\nOffene Wunde Kopf (Hammer) + Kratzer (durch Vordach brechen)</p>\n\n<p><strong>H PLATZT MIT KATZE UND DRINK REIN</strong><br>\nH beruhigt Lara, dass Auto noch ganz ist<br>\nH entschuldigt sich wegen der Dachsache bei solchen Umständen (Eis, Schnee)</p>\n\n<p><strong>DUSCHEN</strong><br>\nSam duscht, Lara legt sich zum Ausruhen aufs Bett<br>\nKatze kommt unter Bett hervor und flauscht sich dabei</p>\n\n<p><strong>SCHLAFEN</strong><br>\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!<br>\nSam vs Katze, Sam wins!, Sam gets cuddles</p>\n\n<p><strong>UMZIEHEN</strong><br>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an</p>\n\n<p><strong>DINNERTIME</strong></p>",
		'passages': {
		},
	},
	'ResultH_110': {
		'text': "<p>Lara sagt Sam, dass sie’s mit Ziehen versucht<br>\nLara zieht und ROR, fängt sich aber, Schnur hängt an Lara fest<br>\nH zieht an seinem Ende der Schnur<br>\nLara wird zur H hin von Dach gezogen<br>\nfällt auf und bricht durch Vordach<br>\nlandet auf Rentier</p>\n<p><strong>ZIMMER/VERARZTEN</strong><br>\nSam betrübt, weil alles schief ging<br>\nSam entschuldigt sich bei Lara für Verhalten<br>\nLara entschuldigt sich auch<br>\naufheiternder Scherz mit Bezug auf dass H sie vom Dach gezogen hat oder Rentierlandung</p>\n\n<p><strong>VERARZTEN</strong><br>\nKratzer + Armverletzung (von Rentier gepiekst)</p>\n\n<p><strong>H PLATZT MIT KATZE UND DRINK REIN</strong><br>\nH bringt Geweih als “Trophäe” mit und zeigt guten Willen<br>\nH entschuldigt sich wegen der Dachsache bei solchen Umständen (Eis, Schnee)</p>\n\n<p><strong>DUSCHEN</strong><br>\nSam duscht, Lara legt sich zum Ausruhen aufs Bett<br>\nKatze kommt unter Bett hervor und flauscht sich dabei</p>\n\n<p><strong>SCHLAFEN</strong><br>\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!<br>\nSam vs Katze, Sam wins!, Sam gets cuddles</p>\n\n<p><strong>UMZIEHEN</strong><br>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an</p>\n\n<p><strong>DINNERTIME</strong></p>",
		'passages': {
		},
	},
	'Drink yes': {
		'text': "",
		'attributes': ["drink2"],
		'js': function() {
			var res = squiffy.get("endResult");
			squiffy.story.go(res);
		},
		'passages': {
		},
	},
	'Drink no': {
		'text': "",
		'js': function() {
			var res = squiffy.get("endResult");
			squiffy.story.go(res);
		},
		'passages': {
		},
	},
	'EndSzenarioH_01': {
		'text': "<p>{if drink2:\nH bietet dritten Drink an, weil Lara so fröhlich 2. annahm<br>\nSam: “Hoookay, That’s enough…”<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde}</p>\n<p>{else:\nLara wirft Hilfeblick zu Sam<br>\nSam kommt zu Hilfe<br>\nsagt sie will duschen und Lara sollte trockene Sachen anziehen<br>\nund wie sieht H überhaupt aus, also echt mal<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde}</p>\n<p><strong>ZIMMER/BEREIT MACHEN</strong></p>\n\n<p>Sam: “Das fängt ja gut an… Wollt ausnahmsweise einfach ein gesittetes Treffen mit Eltern bei dem sie dich kennen lernen können, aber nein…”<br>\nLara the boob cushion<br><br></p>\n<p>{if drink2:\nLara chill/er (2 Drinks), Sam deswegen besorgt <br>\nLara: ¯_(?)_/¯ <br><br></p>\n<p>Bei 2 Drinks (&amp; Sam besorgt):<br>\nLara redet Sam gut zu, versucht sie zu beruhigen, sagt Kosenamen, den H verwendet hat for A.<br>\nSam: Don’t you dare.<br>\nLara: “Don’t like it? How about Samwich.” etc.}\n{else:\nLara chill, Sam deswegen besorgt <br>\n}</p>\n<p><strong>DUSCHEN</strong><br>\n{if drink2:\n2 Drinks: Lara anhänglicher / touchy-feely</p>\n}\n\n{else:\nLara: I’m fine<br>\nSam: Just lemme check on you<br>\nLara: okay...<br>\nbeide duschen + check-up\n</p>\n}\n\n<p><strong>SCHLAFEN</strong><br>\n{if drink2:\nZum Ausnüchtern<br>\nWenn Lara aufwacht, ist Lara breit, und Sam bereit (umgezogen)</p>\n}\n\n{else:\ncuddle and nap</p>\n}\n\n<p><strong>UMZIEHEN</strong><br>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an<br></p>\n\n<p><strong>DINNERTIME</strong></p>",
		'passages': {
		},
	},
	'EndSzenarioH_001': {
		'text': "<p>{if drink2:\nH bietet dritten Drink an, weil Lara so fröhlich 2. annahm<br>\nSam: “Hoookay, That’s enough…”<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde}</p>\n<p>{else:\nLara wirft Hilfeblick zu Sam<br>\nSam kommt zu Hilfe<br>\nsagt sie will duschen und Lara sollte trockene Sachen anziehen<br>\nund wie sieht H überhaupt aus, also echt mal<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde}</p>\n<p><strong>ZIMMER/BEREIT MACHEN</strong></p>\n\n<p>Sam: “Das fängt ja gut an… Wollt ausnahmsweise einfach ein gesittetes Treffen mit Eltern bei dem sie dich kennen lernen können, aber nein…”<br>\nLara the badass<br><br></p>\n<p>{if drink2:\nLara chill/er (2 Drinks), Sam deswegen besorgt <br>\nLara: ¯_(?)_/¯ <br><br></p>\n<p>Bei 2 Drinks:<br>\nLara redet Sam gut zu, versucht sie zu beruhigen, sagt Kosenamen, den H verwendet hat for A.<br>\nSam: Don’t you dare.<br>\nLara: “Don’t like it? How about Samwich.” etc.}\n{else:\nLara chill, Sam deswegen besorgt <br>\n}</p>\n<p><strong>DUSCHEN</strong><br>\n{if drink2:\n2 Drinks: Lara lässt sich in Dusche zerren</p>\n}\n\n{else:\nLara geht erst duschen, da Sam sich erst um ihre Sachen kümmern will\nwährend Sam duscht, kratzt Katze an Tür</p>\n}\n\n<p><strong>SCHLAFEN</strong><br>\n{if drink2:\nZum Ausnüchtern<br>\nWenn Lara aufwacht, ist Lara breit, und Sam bereit (umgezogen)</p>\n}\n\n{else:\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!</p>\n}\n\n<p><strong>UMZIEHEN</strong><br>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an<br></p>\n\n<p><strong>DINNERTIME</strong></p>",
		'passages': {
		},
	},
	'EndSzenarioH_10': {
		'text': "<p>{if drink2:\nH bietet dritten Drink an, weil Lara so fröhlich 2. annahm<br>\nSam: “Hoookay, That’s enough…”<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde<br>\n}\n{else:\nSam scherzt wegen Lara, die zu H gehalten hat<br>\nlässt H ihr 2. Drink aufzwingen bevor sie Lara hilft<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde<br>\n}</p>\n<p><strong>ZIMMER/BEREIT MACHEN</strong></p>\n\n<p>es war doch eine gute Idee von Lara freiwillig zu helfen<br>\nläuft gut mit H<br>\npositiv überrascht und entspannt, weil alles so gut lief irgendwie<br><br></p>\n<p>Bei 2 Drinks:<br>\nLara redet Sam gut zu, versucht sie zu beruhigen, sagt Kosenamen, den H verwendet hat for A.<br>\nSam: Don’t you dare.<br>\nLara: “Don’t like it? How about Samwich.” etc.<br></p>\n<p><strong>DUSCHEN</strong><br>\nZum Aufwärmen</p>\n\n<p><strong>SCHLAFEN</strong><br>\nZum Ausnüchtern<br>\nWenn Lara aufwacht, ist Lara breit, und Sam bereit (umgezogen)</p>\n\n<p><strong>UMZIEHEN</strong><br>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an</p>\n\n<p><strong>DINNERTIME</strong></p>",
		'attributes': ["drink2"],
		'passages': {
		},
	},
}
})();