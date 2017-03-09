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
squiffy.story.id = '75486b01cb';
squiffy.story.sections = {
	'setvariables': {
		'text': "<p>{start}</p>",
		'attributes': ["SC = 0","PC = 0","fail = 0","not salarawin","not parentswin","not tie","not carkiss","not greetingfail","antonia","not clothes","not compliment","not samstory","not sammad","not samclothes","not interrupt","hisao","not tease","not roof","not samhelp","not tool","not drink2","not accident","not accident_involve","not chopsticks","not spoon"],
		'passages': {
		},
	},
	'start': {
		'text': "<p><h1>Kapitel 1: Ankunft</h1>\n<span id=\"ch1\"></span>\nSalara fahren im schicken Schlitten zur Residenz<br/>\nUnterhalten sich währenddessen über A/H, die not-to-do Liste gegenüber A etc<br/>\nSam flauscht sich ran</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Carkiss yes\" role=\"link\" tabindex=\"0\">Carkiss yes</a> <a class=\"squiffy-link link-section\" data-section=\"Carkiss no\" role=\"link\" tabindex=\"0\">Carkiss no</a></p>",
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
		'text': "<p>Resting sounds good.<br/>\nA sagt sie muss sich noch um etwas kümmern, dann lässt sie nach Salara rufen, wenn sie Zeit hat <br/>\nGeräusch aus der Küche lässt sich davonwuseln<br/>\n&quot;Sam du weißt wo es lang geht. Du machst das schon.&quot;</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Antonia\" role=\"link\" tabindex=\"0\">Kapitel 2</a></p>",
		'passages': {
		},
	},
	'Hisao_pre': {
		'text': "<p>Lara bietet sich sogleich an beim Vorhaben zu helfen <br>\nSam: Sweetie <em>hust</em> what are you doing?! <_< <br>\nH geht mit Salara raus um Beleuchtung abzunehmen <br>\nSalara zieht sich wieder an/oder ist noch angezogen?, Sam ist whiny </p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Hisao\" role=\"link\" tabindex=\"0\">Kapitel 2</a></p>",
		'passages': {
		},
	},
	'Antonia': {
		'text': "<p><h1>Kapitel 2: A</h1>\n<span id=\"ch2\"></span></p>\n<p>Salara gehen auf ihre Zimmer, die verbunden sind<br>\nAkito folgt ihnen und beglotzt alles<br>\nSalara labern über die 2 Zimmer Sache<br>\n<br>\n{if greetingfail:</p>\n<p><p><strong>Sam neckt Lara über den GREETINGFAIL den sie mit H hatte</strong></p>\n}\nSam geht erstmal duschen, Lara packt Tasche aus<br>\nFührt Katzenmonolog über den Ring<br>\nBringt dann Sam Handtuch ins Bad, gehen zusammen zurück ins Zimmer<br>\nSam öffnet ihren Koffer und erstes Katzendrama beginnt<br>\nSam bietet Lara ein Outfit fürs Dinner an.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Clothes yes\" role=\"link\" tabindex=\"0\">Clothes yes</a> <a class=\"squiffy-link link-section\" data-section=\"Clothes no\" role=\"link\" tabindex=\"0\">Clothes no</a> </p>",
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
		'attributes': ["samclothes"],
		'js': function() {
			    squiffy.set("SC", 2);
			    squiffy.set("PC", 0);
			    
		},
		'passages': {
		},
	},
	'Punsch transition': {
		'text': "<p>Nach dem Kleiderschrank Besuch, ruft A zum Punschtrinken auf<br>\nLässt diesen ins Wohnzimmer bringen, sagt in der Küche Bescheid<br>\nSetzen sich derweil schonmal hin und warten<br></p>\n<p>{if sammad:</p>\n<p><p><strong>\nSam stützt sich auf Armlehne, weg von Lara <br>\nA redet über Punsch während sie auf ihn warten, über das tolle Wunderrezept<br>\nSam warnt Lara nicht vor dem Punsch</strong></p>\n}\n{else:</p>\n<p><p><strong>\nA im Sessel, Salara auf Couch<br>\nA redet über Punsch während sie auf ihn warten, über das tolle Wunderrezept<br>\nSam flüstert Lara Warnungen zu</strong></p>\n}</p>\n<p>Fragen zu Sams Verhalten privat zum Thema, dass sie zusammen wohnen, zu Lara, zu Laras Dating Life, zu Sams Dating Life</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Interrupt yes\" role=\"link\" tabindex=\"0\">Interrupt yes</a> <a class=\"squiffy-link link-section\" data-section=\"Interrupt no\" role=\"link\" tabindex=\"0\">Interrupt no</a> </p>",
		'passages': {
		},
	},
	'Interrupt yes': {
		'text': "<p>Lara verlangt mehr Punsch zum Ablenken, und wie toll der doch ist, trinkt erste Fuhre auf Ex, und noch mehr und dann wird ihr schlecht<br>\nAngestellter kommt rein, informiert A über Essen<br>\nA beauftragt Sam sich um Lara zu kümmern (Glas Wasser blabla)<br>\nVerschwindet um nach Essen zu sehen<br>\n<br>\nSalara Fluffmoment, mit Entschuldigungen und Dinnerängsten<br>\nLaras Auftrag: Sam helfen A nicht an die Gurgel zu gehen</p>\n<p></br></br></br>\nÜbergang Dinner</p>\n<p>SALARA: {SC}\nELTERN: {PC}\nFP: {fail}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
		'attributes': ["interrupt"],
		'js': function() {
			    squiffy.set("fail", 1);
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
		'text': "<p>A fängt an fiese peinliche Fragen zu stellen</br>\nLara verschluckt sich am Punsch und Runde wird abgebrochenAngestellter kommt rein, informiert A über Essen<br>\nA beauftragt Angestellten Lara ein Glas Wasser zu holen<br>\nVerschwindet um nach Essen zu sehen<br>\n<br>\nSalara Fluffmoment, mit Entschuldigungen und Dinnerängsten<br>\nLaras Auftrag: Sam helfen A nicht an die Gurgel zu gehen</p>\n<p></br></br></br>\nÜbergang Dinner</p>\n<p>SALARA: {SC}\nELTERN: {PC}\nFP: {fail}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
		'js': function() {
			squiffy.set("fail", 1);
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
		'text': "<p><h1>Kapitel 2: H</h1>\n<span id=\"ch2\"></span>\nSalara geht mit H nach draußen um die Beleuchtung abzunehmen<br>\nH macht scherzhaft Bemerkung, dass er wünschte, seine Tochter wäre so hilfreich wie Lara<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Tease yes\" role=\"link\" tabindex=\"0\">Tease yes</a> <a class=\"squiffy-link link-section\" data-section=\"Tease no\" role=\"link\" tabindex=\"0\">Tease no</a></p>",
		'attributes': ["hisao","samclothes"],
		'passages': {
		},
	},
	'Tease yes': {
		'text': "<p>Lara scherzt mit H<br>\nSam nicht so begeistert davon<br>\nGucken Haus von außen an und was zu tun ist<br>\nBeleuchtung an Front wurde zur Hälfte abgenommen und da sind noch Lichterketten auf dem Dach<br>\nH sagt, er geht auf&#39;s Dach per Leiter um das da oben abzunehmen<br>\nSam redet es ihm aus</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Roof yes\" role=\"link\" tabindex=\"0\">Roof yes</a> <a class=\"squiffy-link link-section\" data-section=\"Roof no\" role=\"link\" tabindex=\"0\">Roof no</a></p>",
		'attributes': ["tease","number1 = 1"],
		'passages': {
		},
	},
	'Tease no': {
		'text': "<p>Lara verteidigt Sam <br>\nGucken Haus von außen an und was zu tun ist<br>\nBeleuchtung an Front wurde zur Hälfte abgenommen und da sind noch Lichterketten auf dem Dach<br>\nH sagt, er geht auf&#39;s Dach per Leiter um das da oben abzunehmen<br>\nSam redet es ihm aus</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Roof yes\" role=\"link\" tabindex=\"0\">Roof yes</a> <a class=\"squiffy-link link-section\" data-section=\"Roof no\" role=\"link\" tabindex=\"0\">Roof no</a></p>",
		'attributes': ["number1 = 0"],
		'passages': {
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
		'text': "<p>{if roof: \nLARA steigt aufs Dach<br>\nSchaut sich die Beleutung an, Schnur hängt fest<br>\nH sagt sie soll ein Werkzeug benutzen<br>\nSam meint sie soll einfach ziehen</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Tool yes\" role=\"link\" tabindex=\"0\">Tool yes</a> <a class=\"squiffy-link link-section\" data-section=\"Tool no\" role=\"link\" tabindex=\"0\">Tool no</a>}</p>\n<p>{else: \nSAM steigt aufs Dach<br>\nSchaut sich Beleuchtung an, Schnur hängt fest<br>\nH braucht auch kurz Hilfe</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Help Sam\" role=\"link\" tabindex=\"0\">Help Sam</a> <a class=\"squiffy-link link-section\" data-section=\"Help Hisao\" role=\"link\" tabindex=\"0\">Help Hisao</a>}</p>",
		'passages': {
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
		'text': "<p>Sam steigt aufs Dach<br>\nSam fühlt sich unterstützt<br>\nSams Schnur steckt fest &amp; H braucht ganz kurz Hilfe mit Schnur bei sich<br>\nIst selbe Schnur, wenn sie H hilft, passiert was mit Sam und umgekehrt<br>\nWenn Schnur hakt bei Sam und H, verlangt Sam, dass ihr erst der Hammer gegeben wird, damit’s da oben vorangeht<br>\nwährend Lara H hilft danach, wirft Sam Schneeball, wenn sie schon fertig ist<br>\nSam: &quot;Lara!&quot;<br>\nLara dreht sich um &quot;Huh?&quot;klatsch<br>\nH: &quot;Sam, that&#39;s not nic-&quot; klatsch<br></p>\n<h2>H lädt zu einem Drink ein</h2>\n\n<p>H lobt Sam’s Einsatz<br>\nSam hält eine “I’m awesome” Anstoßrede<br>\nsüffeln ihren Drink</p>\n<h2>H bietet zweiten Drink an</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Drink yes\" role=\"link\" tabindex=\"0\">Drink yes</a> <a class=\"squiffy-link link-section\" data-section=\"Drink no\" role=\"link\" tabindex=\"0\">Drink no</a></p>",
		'attributes': ["endResult = EndSzenarioH_10"],
		'js': function() {
			    squiffy.set("SC", 1);
			    squiffy.set("PC", 1);
			    
		},
		'passages': {
		},
	},
	'ResultH_01': {
		'text': "<p>Lara steigt aufs Dach<br>\nSam ist froh, wollte ohnehin nicht aufs Dach<br>\nSam is bissl besorgt um Lara<br>\nlara sagt, Schnur steckt fest<br>\nH sagt sie soll Hammer nehmen<br>\nSam will Hammer bringen<br>\nsteigt über Leiter auf  Vordach um ihn Lara zu geben, damit Lara sich nicht mehr als notwendig oben bewegen muss<br>\nLeiter rutscht weg wenn Sam auf Vordach steigt<br>\nSam taumelt auf rutschigem Vordach aber fängt sich<br>\nLara tritt auf losen Ziegel, wenn sie den Hammer abholen will<br>\nVerliert Halt, fällt<br>\nSam fängt sie, verliert dabei Balance wegen rutschigen Dach<br>\nfallen um, rutschen Vordach runter, landen im Schnee, Lara unten<br>\nSam haut eine cheesy pickup-line raus</p>\n<h2>H lädt zu einem Drink ein</h2>\n\n<p>H ist erfreut von Lara’s Einsatz bzgl. Hilfe &amp; Sam verteidigen<br>\nerwähnt was er schon so gehört hat von ihr<br>\nH macht “dadjokes”<br>\nsome booze for the bruise<br>\nSam facepalm =__=</p>\n<h2>H bietet zweiten Drink an</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Drink yes\" role=\"link\" tabindex=\"0\">Drink yes</a> <a class=\"squiffy-link link-section\" data-section=\"Drink no\" role=\"link\" tabindex=\"0\">Drink no</a></p>",
		'attributes': ["endResult = EndSzenarioH_01"],
		'js': function() {
			    squiffy.set("SC", 2);
			    squiffy.set("PC", 0);
		},
		'passages': {
		},
	},
	'ResultH_001': {
		'text': "<p>Sam jammert oben rum (Schnee, windig, rutschig, kalt, und Schnur hängt)<br>\nH sagt Hammer<br>\nLara bringt es hoch aufs Dach<br>\nSam steht bei Leiter<br>\nLeiter rutscht weg<br>\nSam greift nach Hand<br>\nLara zieht sich mit Sam’s Hilfe hoch<br>\nH hilft mit Leiter, sie kommen runter und brechen ab</p>\n<h2>H lädt zu einem Drink ein</h2>\n\n<p>H ist erfreut von Lara’s Einsatz bzgl. Hilfe &amp; Sam verteidigen<br>\nerwähnt was er schon so gehört hat von ihr<br>\nH beeindruckt von Laras Geschick<br>\nSam macht nudge-Andeutung<br>\nLara verschluckt sich</p>\n<h2>H bietet zweiten Drink an</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Drink yes\" role=\"link\" tabindex=\"0\">Drink yes</a> <a class=\"squiffy-link link-section\" data-section=\"Drink no\" role=\"link\" tabindex=\"0\">Drink no</a></p>",
		'attributes': ["endResult = EndSzenarioH_001"],
		'js': function() {
			    squiffy.set("SC", 2);
			    squiffy.set("PC", 0);
		},
		'passages': {
		},
	},
	'ResultH_000': {
		'text': "<p>Sam jammert oben rum, setzt sich hin während sie auf Lara wartet<br>\nNachdem Lara H geholfen hat, steigt sie mit Hammer leiter hoch<br>\nLeiter rutscht weg, Sam steht nicht parat<br>\nLara greift nach Schnur, zieht Beleuchtung mit sich nach unten<br>\nSam tritt beim Nachgucken Ziegel los<br>\nZiegel fällt auf Lara</p>\n<p>{ResultH_000_detail}</p>\n<h2>DINNERTIME</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
		'attributes': ["accident"],
		'js': function() {
			    squiffy.set("fail", 1);
			    squiffy.set("SC", 1);
			    squiffy.set("PC", 1);
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
	'ResultH_000_detail': {
		'text': "<p><h2>ZIMMER/VERARZTEN</h2>\nSam: Karma is a bitch, aber aufheiternder Scherz, dass es hätte schlimmer kommen können (Bezug auf andere Szenarien)<br>\nLara: &quot;you think your dad will be angry blabla&quot; <br>\nSam &quot;i think he&#39;s glad the stuff is down<br></p>\n<p><h2>VERARZTEN</h2>\nOffene Wunde Kopf (Ziegel)</p></p>\n<p><h2>H PLATZT MIT KATZE UND DRINK REIN</h2>\nH beruhigt Lara, dass Beleuchtung nicht so wichtig ist<br></p>\n<p><h2>DUSCHEN</h2>\nSam duscht, Lara legt sich zum Ausruhen aufs Bett<br>\nKatze kommt unter Bett hervor und flauscht sich dabei<br></p>\n<p><h2>SCHLAFEN</h2>\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!<br>\nSam vs Katze, Sam wins!, Sam gets cuddles<br></p>\n<p><h2>UMZIEHEN</h2>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an<br></p>",
		'passages': {
		},
	},
	'ResultH_111': {
		'text': "<p>Sam, genervt, wirft Hammer  hoch<br>\nLara versucht Hammer zu fangen, tritt auf Ziegel, abeglenkt<br>\nHammer trifft Lara am Kopf, fällt auf Vordach runter<br>\nH: “Armes Dach!”<br>\nLara fällt hitnerher<br>\nbricht durch Vordach durch<br>\nlandet auf Auto</p>\n<p>{ResultH_111_detail}</p>\n<h2>DINNERTIME</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
		'attributes': ["accident"],
		'js': function() {
			    squiffy.set("fail", 1);
			    squiffy.set("SC", 0);
			    squiffy.set("PC", 3);
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
	'ResultH_111_detail': {
		'text': "<p><h2>ZIMMER/VERARZTEN</h2>\nSam betrübt, weil alles schief ging<br>\nSam entschuldigt sich bei Lara für Verhalten<br>\nLara entschuldigt sich auch<br></p>\n<p><h2>VERARZTEN</h2>\nOffene Wunde Kopf (Hammer) + Kratzer (durch Vordach brechen)<br></p>\n<p><h2>H PLATZT MIT KATZE UND DRINK REIN</h2>\nH beruhigt Lara, dass Auto noch ganz ist<br>\nH entschuldigt sich wegen der Dachsache bei solchen Umständen (Eis, Schnee)<br></p>\n<p><h2>DUSCHEN</h2>\nSam duscht, Lara legt sich zum Ausruhen aufs Bett<br>\nKatze kommt unter Bett hervor und flauscht sich dabei<br></p>\n<p><h2>SCHLAFEN</h2>\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!<br>\nSam vs Katze, Sam wins!, Sam gets cuddles<br></p>\n<p><h2>UMZIEHEN</h2>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an<br></p>",
		'passages': {
		},
	},
	'ResultH_110': {
		'text': "<p>Lara sagt Sam, dass sie’s mit Ziehen versucht<br>\nLara zieht und ROR, fängt sich aber, Schnur hängt an Lara fest<br>\nH zieht an seinem Ende der Schnur<br>\nLara wird zur H hin von Dach gezogen<br>\nfällt auf und bricht durch Vordach<br>\nlandet auf Rentier</p>\n<p>{ResultH_110_detail}</p>\n<h2>DINNERTIME</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
		'attributes': ["accident"],
		'js': function() {
			    squiffy.set("fail", 1);
			    squiffy.set("SC", 1);
			    squiffy.set("PC", 2);
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
	'ResultH_110_detail': {
		'text': "<p><h2>ZIMMER/VERARZTEN</h2>\nSam betrübt, weil alles schief ging<br>\nSam entschuldigt sich bei Lara für Verhalten<br>\nLara entschuldigt sich auch<br>\naufheiternder Scherz mit Bezug auf dass H sie vom Dach gezogen hat oder Rentierlandung<br></p>\n<p><h2>VERARZTEN</h2>\nKratzer + Armverletzung (von Rentier gepiekst)<br></p>\n<p><h2>H PLATZT MIT KATZE UND DRINK REIN</h2>\nH bringt Geweih als “Trophäe” mit und zeigt guten Willen<br>\nH entschuldigt sich wegen der Dachsache bei solchen Umständen (Eis, Schnee)<br></p>\n<p><h2>DUSCHEN</h2>\nSam duscht, Lara legt sich zum Ausruhen aufs Bett<br>\nKatze kommt unter Bett hervor und flauscht sich dabei<br></p>\n<p><h2>SCHLAFEN</h2>\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!<br>\nSam vs Katze, Sam wins!, Sam gets cuddles<br></p>\n<p><h2>UMZIEHEN</h2>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an<br></p>",
		'passages': {
		},
	},
	'Drink yes': {
		'text': "",
		'attributes': ["drink2"],
		'js': function() {
			var sum = squiffy.get("PC") + 1;
			squiffy.set("PC", sum);
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
		'text': "<p>{if drink2:</p>\n<p><p><strong>\nH bietet dritten Drink an, weil Lara so fröhlich 2. annahm<br>\nSam: “Hoookay, That’s enough…”<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\nLara wirft Hilfeblick zu Sam<br>\nSam kommt zu Hilfe<br>\nsagt sie will duschen und Lara sollte trockene Sachen anziehen<br>\nund wie sieht H überhaupt aus, also echt mal<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde\n</strong></p>\n}</p>\n<p>{EndSzenarioH_01_detail}</p>\n<h2>DINNERTIME</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
		'attributes': ["accident","accident_involve"],
		'js': function() {
			    squiffy.set("fail", 1);
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
	'EndSzenarioH_01_detail': {
		'text': "<h2>ZIMMER/BEREIT MACHEN</h2>\n\n<p>Sam: “Das fängt ja gut an… Wollt ausnahmsweise einfach ein gesittetes Treffen mit Eltern bei dem sie dich kennen lernen können, aber nein…”<br>\nLara the boob cushion<br><br></p>\n<p>{if drink2:</p>\n<p><strong>\nLara chill/er (2 Drinks), Sam deswegen besorgt <br>\nLara: ¯_(?)_/¯ <br><br>\nBei 2 Drinks (&amp; Sam besorgt):<br>\nLara redet Sam gut zu, versucht sie zu beruhigen, sagt Kosenamen, den H verwendet hat for A.<br>\nSam: Don’t you dare.<br>\nLara: “Don’t like it? How about Samwich.” etc.}\n</strong></p>\n\n<p>{else:</p>\n<p><p><strong>\nLara chill, Sam deswegen besorgt\n</strong></p>\n}</p>\n<p><h2>DUSCHEN</h2>\n{if drink2:</p>\n<p><p><strong>\n2 Drinks: Lara anhänglicher / touchy-feely\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\nLara: I’m fine<br>\nSam: Just lemme check on you<br>\nLara: okay...<br>\nbeide duschen + check-up\n</strong></p>\n}</p>\n<p><h2>SCHLAFEN</h2>\n{if drink2:</p>\n<p><p><strong>\nZum Ausnüchtern<br>\nWenn Lara aufwacht, ist Lara breit, und Sam bereit (umgezogen)\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\ncuddle and nap\n</strong></p>\n}</p>\n<p><h2>UMZIEHEN</h2>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an<br></p>",
		'passages': {
		},
	},
	'EndSzenarioH_001': {
		'text': "<p>{if drink2:\nH bietet dritten Drink an, weil Lara so fröhlich 2. annahm<br>\nSam: “Hoookay, That’s enough…”<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde}</p>\n<p>{else:\nLara wirft Hilfeblick zu Sam<br>\nSam kommt zu Hilfe<br>\nsagt sie will duschen und Lara sollte trockene Sachen anziehen<br>\nund wie sieht H überhaupt aus, also echt mal<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde}</p>\n<p>{EndSzenarioH_001_detail}</p>\n<p><strong>DINNERTIME</strong></p>\n\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
		'attributes': ["accident_involve"],
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
	'EndSzenarioH_001_detail': {
		'text': "<h2>ZIMMER/BEREIT MACHEN</h2>\n\n<p>Sam: “Das fängt ja gut an… Wollt ausnahmsweise einfach ein gesittetes Treffen mit Eltern bei dem sie dich kennen lernen können, aber nein…”<br>\nLara the badass<br><br></p>\n<p>{if drink2:</p>\n<p><p><strong>\nLara chill/er (2 Drinks), Sam deswegen besorgt <br>\nLara: ¯_(?)_/¯ <br><br>\nBei 2 Drinks:<br>\nLara redet Sam gut zu, versucht sie zu beruhigen, sagt Kosenamen, den H verwendet hat for A.<br>\nSam: Don’t you dare.<br>\nLara: “Don’t like it? How about Samwich.” etc.\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\nLara chill, Sam deswegen besorgt <br>\n</strong></p>\n}</p>\n<p><h2>DUSCHEN</h2>\n{if drink2:</p>\n<p><p><strong>\n2 Drinks: Lara lässt sich in Dusche zerren\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\nLara geht erst duschen, da Sam sich erst um ihre Sachen kümmern will\nwährend Sam duscht, kratzt Katze an Tür\n</strong></p>\n}</p>\n<p><h2>SCHLAFEN</h2>\n{if drink2:</p>\n<p><p><strong>\nZum Ausnüchtern<br>\nWenn Lara aufwacht, ist Lara breit, und Sam bereit (umgezogen)\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\nLara mit Katze im Bett und Sam kommt vom duschen rein und : O___O NO!\n</strong></p>\n}</p>\n<p><h2>UMZIEHEN</h2>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an<br></p>",
		'passages': {
		},
	},
	'EndSzenarioH_10': {
		'text': "<p>{if drink2:\nH bietet dritten Drink an, weil Lara so fröhlich 2. annahm<br>\nSam: “Hoookay, That’s enough…”<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde<br>\n}\n{else:\nSam scherzt wegen Lara, die zu H gehalten hat<br>\nlässt H ihr 2. Drink aufzwingen bevor sie Lara hilft<br>\nRückkehr zum Zimmer, da Sam duschen will und genug gesüffelt wurde<br>\n}</p>\n<p>{EndSzenarioH_10_detail}</p>\n<h2>DINNERTIME</h2>\n\n<p>SALARA: {SC}\nELTERN: {PC}\n<br/>\n{if salarawin: SALARAWIN}\n{if parentswin: PARENTSWIN}\n{if tie: TIE}</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Kapitel 3\" role=\"link\" tabindex=\"0\">Kapitel 3</a></p>",
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
	'EndSzenarioH_10_detail': {
		'text': "<h2>ZIMMER/BEREIT MACHEN</h2>\n\n<p>es war doch eine gute Idee von Lara freiwillig zu helfen<br>\nläuft gut mit H<br>\npositiv überrascht und entspannt, weil alles so gut lief irgendwie<br><br>\nBei 2 Drinks:<br>\nLara redet Sam gut zu, versucht sie zu beruhigen, sagt Kosenamen, den H verwendet hat for A.<br>\nSam: Don’t you dare.<br>\nLara: “Don’t like it? How about Samwich.” etc.<br></p>\n<p><h2>DUSCHEN</h2>\nZum Aufwärmen</p></p>\n<p><h2>SCHLAFEN</h2>\nZum Ausnüchtern<br>\nWenn Lara aufwacht, ist Lara breit, und Sam bereit (umgezogen)</p></p>\n<p><h2>UMZIEHEN</h2>\nSam überredet Lara zu Outfit<br>\nSam zieht ihr Kleid an</p></p>",
		'passages': {
		},
	},
	'Kapitel 3': {
		'text': "<p><h1>Kapitel 3: Dinnertime</h1>\n<span id=\"ch3\"></span></p>\n<p>{if antonia:\n{PreDinnerA}\n}\n{else:\n{PreDinnerH}\n}</p>\n<p>{Gang1}</p>",
		'passages': {
		},
	},
	'PreDinnerA': {
		'text': "<p>Salara kommen ins Esszimmer, dort ist H anwesend und tüdelt an seinem Handy<br>\nals H die beiden bemerkt, fasst er sich kurz am Fooon um den beiden Aufmerksamkeit zu schenken<br>\nA ist noch in der Küche das Personal auspeitschen<br>\nKatze ist Salara gefolgt und verkrümelt sich irgendwo unbemerkt<br>\n<br>\nH erkundigt sich über Lara’s Befinden, hat von A gehört was Sache war<br>\nmacht Salara Komplimente über die schicken Outfits<br></p>\n<p>{if samclothes:</p>\n<p><p><strong>\nLara sagt brav danke, merkt aber an dass Sam geholfen hat<br>\nH muss lachen und scherzt wie sehr Sam anfängt ihrer Mutter zu ähneln<br>\nSam: DAD pls ಠ<em>ಠ<br>\nLara: eh... eh.... cough<br>\nH: ^<strong>_</strong></em>^ <em>nimmt Sam in den Arm und muss sie einmal durchknuffen</em><br>\nSam: DAD pls<br>\nLara: ^/////^ <em>fangirl</em>\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\nH ahnt, dass A es ihr aufgedrängt hat, fängt an über A’s typisches Verhalten zu labern und was er auch schon hinter sich hat und dass er dem berühmten Nishimura A Blick nicht stand halten kann<br>\nLara kennt den Blick zu gut und schaut wissend zu Sam\n</strong></p>\n}</p>\n<h2>A kommt ins Esszimmer</h2>\n\n<p>H sagt zu A, wenn sie reinkommt, er habe jemanden für den nächsten Tag bestellt, die Beleuchtung vom Dach abzunehmen<br>\nA wirft ihm schweigend einen vorwurfsvollen Blick zu, und er: &quot;Ich brech mir doch nicht den Hals auf dem vereisten Dach. Soll das jemand machen, der sich dafür bezahlen lassen will.&quot;<br>\nA: augendreh<br>\nH beruhigt sie mit dem Kosenamen wieder<br>\nAlle sitzen endlich und das Essen kann beginnen :0</p>",
		'passages': {
		},
	},
	'PreDinnerH': {
		'text': "<p>Salara kommen ins Esszimmer, dort ist A anwesend und rückt nochmal jedes Stück Besteck um einen halben Zentimeter richtig<br>\nH ist noch beschäftigt sich umzuziehen, da er telefoniert und einen zuviel im Tee hat<br>\nKatze ist Salara gefolgt und verkrümelt sich irgendwo unbemerkt</p>\n<p>{if accident:</p>\n<p><p><strong>\nA erkundigt sich über Lara’s Befinden, hat mitbekommen dass ein Unfall passiert ist<br>\nA meckert, dass die Beleuchtung längst hätte unten sein sollen, da hatte es auch noch nicht geschneit, aber H fand sie ja ach so toll\n</strong></p>\n}</p>\n<p>{else:</p>\n<p><p><strong>\nA spricht Beleuchtung an, dass sie endlich unten ist, und dass Salara geholfen haben\n</strong></p>\n}</p>\n<p>A bemerkt Sam’s Kleid, lobt ihre Wahl von schickeren Sachen als früher<br>\nSam: “My outfits were perfectly fine!”<br>\nA ignoriert Sam und sagt, dass auch Lara toll aussieht<br>\nLara will sagen, dass das Outfit Sams Wahl war, aber Sam würgt sie ab und besteht darauf, dass das Laras Sachen sind<br>\nA bietet Lara an, falls sie paar schicke Kleider will, dass sie einiges anzubieten hätte, aber Sam würgt A ab, A wirf Sam Mörderblick zu</p>\n<h2>H kommt ins Esszimmer</h2>\n\n<p>verteilt erstmal Komplimente an alle Damen und fühlt sich glücklich in so schicker Gesellschaft zu sein<br>\nA macht ihn nochmal zur Schnecke wenn die Beleuchtung immer noch nicht unten ist<br>\nSam flüstert Lara mehr oder weniger ernsthaft zu, sie soll Sam helfen beim Dinner ruhig zu bleiben und A nicht an die Gurgel zu springen<br>\nlobt A natürlich am meisten dann und benutzt Kosenamen als er DEN A Blick bekommt<br>\nA gibt nach und A/H turteltäubchen-en, Sam: “Ew STAPH &gt;<em>__</em>&lt;”, Lara: o////o<br>\nA setzt sich demonstrativ Sam gegenüber, Sam stöhnt in Richtung Lara</p>",
		'passages': {
		},
	},
	'Gang1': {
		'text': "<p>Befinden von Lara<br>\n{if endResult=EndSzenarioH_01:</p>\n<p><p><strong>Sam war in Unfall verwickelt: SZENARIO + +</strong></p>\n}\n{if endResult=EndSzenarioH_001:</p>\n<p><p><strong>Sam war in Unfall verwickelt: SZENARIO + - +</strong></p>\n}\n{if not accident_involve:</p>\n<p><p><strong>Sam war nicht in Unfall verwickelt: anderes SZENARIO</strong></p>\n}</p>\n<p>A / H labern angetan wie schön es ist endlich nach so langer Zeit mal wieder zusammen zu sein etc<br> \nLara bedankt sich für Einladung/Gastfreundlichkeit<br></p>\n<p><h2>1. Gang: Miso Suppe mit Muscheln wird serviert</h2>\nEltern sagen, sie hoffen, dass es Lara schmeckt und warten darauf, dass sie probiert<br>\nSam sieht, wie Lara die Suppe ansieht, grinst, und will sehen, wie Lara davon isst<br>\nLara fühlt sich unter Druck gesetzt<br>\nLiegen Stäbchen und Löffel parat, weiß nicht, was sie benutzen soll</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Gang1_Staebchen\" role=\"link\" tabindex=\"0\">Stäbchen</a> <a class=\"squiffy-link link-section\" data-section=\"Gang1_Loeffel\" role=\"link\" tabindex=\"0\">Löffel</a></p>",
		'passages': {
		},
	},
	'Gang1_Staebchen': {
		'text': "<p>Lara probiert verzweifelt etwas auf die Stäbchen zu kriegen<br>\nKlappt nicht, Panik, schnelles Schüssel am Mund schlürfen<br>\nSam verkneift sich Lachen<br>\nAlle fangen an zu essen und Lara probiert erneut einen Stäbchenversuch<br>\nEssen flutscht weg und lockt Katze an, nächstes Stück wird aufgespießt<br>\n<br>\nSam und H unterhalten sich über Japan, H fragt Lara nach Meinung<br>\nLara zu sehr abgelenkt und antwortet voll verplant (übers Haus nicht das Land)<br>\nH erzählt von Sauna und A bietet gleich eine heiße Tour an </p>\n<p>{if antonia: \n(Punschrunde → als Friedensangebot)<br>\n}</p>\n<p><br>\nSam mit Partyhut<br>\nLara zu sehr abgelenkt etwas zu sagen weil sie Muscheln jagt<br></p>\n<p>{if salarawin: \nSam flüstert Lara zu sie soll doch den Löffel benutzen<br>\n}\n{if parentswin: \nSam sagt Lara sie soll doch den Löffel benutzen und zieht Aufmerksamkeit der Eltern wieder auf Lara<br>\nA/H sind voll chill und stimmen dem zu<br>\n}\n{if tie: \nNiemand hilft dem JaffaCake<br>\n}</p>\n<p>bevor Lara dazu kommt krallt sich Katze in ihr Bein<br>\nLara erschreckt sich, lässt Stäbchen fallen und macht ein Facebowl<br></p>\n<p>{if samclothes: \nHose: Suppe schwappt etwas ihr sonst wohin, Katze krallt in Stoff, Lara zieht Krallen raus<br>\n}\n{else: \nKleid: Lara verschüttet weit mehr, Stück Muschelfleisch fliegt in Ausschnitt<br>\n(bei Kleid ist Schüssel fast leer)<br>\n}</p>\n<p>Akito rennt mit Stäbchen weg<br>\nSam hilft Lara sie sauber zu machen<br>\nLara nimmt Löffel um weiter zu essen <br></p>\n<p>{Gang2}</p>",
		'attributes': ["chopsticks"],
		'js': function() {
			    var sum = squiffy.get("fail") + 1;
			    squiffy.set("fail", sum);
		},
		'passages': {
		},
	},
	'Gang1_Loeffel': {
		'text': "<p>Lara greift zum Löffel und fängt an die Suppe zu löffeln<br>\n<br>\nSam und H unterhalten sich über Japan, H fragt Lara nach Meinung<br>\nLara zu sehr abgelenkt und antwortet voll verplant (übers Haus nicht das Land)<br>\nH erzählt von Sauna und A bietet gleich eine heiße Tour an </p>\n<p>{if antonia: </p>\n<p><p><strong>(Punschrunde → als Friedensangebot)</strong></p>\n}</p>\n<p><br>\nSam mit Partyhut<br>\nLara stammelt um nackte Tatsachen rum<br></p>\n<p>{if samclothes:</p>\n<p><p><strong>SZENARIO Sam&#39;s Clothes</strong></p>\n}\n{if not samclothes:</p>\n<p><p><strong>SZENARIO Dress</strong></p></p>\n<p><p><strong>generell wenn sie Kleid anhat, dass sie sich schon mal fast ausziehen musste, das war ihr genug.</strong></p>\n{if sammad:</p>\n<p><p><strong>und - - -, das war ihr definitiv genug. (A, wenn Lara rumstammelt: &quot;Ach, das meiste habe ich eh schon gesehen...&quot;\nSam: MOM, not helping!</strong></p>\n}\n}</p>\n<p>{Gang2}</p>",
		'attributes': ["spoon"],
		'passages': {
		},
	},
	'Gang2': {
		'text': "<p><h2>2. Gang: Tofu mit Krabbensauce wird serviert</h2>\nLara bekommt eine Gabel und ein neues paar Stäbchen vorgesetzt<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Gang2_Staebchen\" role=\"link\" tabindex=\"0\">Stäbchen</a> <a class=\"squiffy-link link-section\" data-section=\"Gang2_Gabel\" role=\"link\" tabindex=\"0\">Gabel</a></p>",
		'passages': {
		},
	},
	'Gang2_Staebchen': {
		'text': "<p>{if chopsticks:\nStäbchen -&gt; Stäbchen: Sam versucht sie wegzunehmen<br>\n{if salarawin: <p><strong>Lara lässt sie sich wegnehmen</strong></p>}\n{if parentswin: <p><strong>Lara lässt sie sich nicht wegnehmen, Sam nervt, bis Lara sie zerbricht</strong></p>}\n{if tie: <p><strong>Lara lässt sie sich nicht wegnehmen</strong></p>}\n}</p>\n<p>{else:\nLöffel -&gt; Stäbchen: Sam versucht es ihr heimlich auszureden, aber Lara versucht es trotzdem, hat Schwierigkeiten und A/H achten nicht drauf, nur Sam hat die ganze Zeit Panik<br>\n{if parentswin:<p><strong>Sam nervt Lara, bis Lara die Stäbchen zerbricht</strong></p>}\n}</p>\n<p>{Gang2_trans_Gang3}</p>",
		'passages': {
		},
	},
	'Gang2_Gabel': {
		'text': "<p>{if chopsticks:\nStäbchen -&gt; Gabel: keiner achtet drauf, weil sie bei der Suppe den Unfall hatte und es ihr niemand verdenkt, dass sie jetzt mit Gabel isst<br>\n}</p>\n<p>{else:\nLöffel -&gt; Gabel: H fragt, warum Lara Stäbchen meidet und will es ihr zeigen und Lara failt<br>\n{if salarawin: <p><strong>Sam greift ein, ZU hilfreich, Lara kommt nicht klar</strong></p>}\n{if parentswin: <p><strong>Eltern ZU hilfreich, Sam versinkt unter Tisch</strong></p>}\n{if tie: <p><strong>andere lassen Lara machen und sie schafft’s</strong></p>}\n}</p>\n<p>{Gang2_trans_Gang3}</p>",
		'passages': {
		},
	},
	'Gang2_trans_Gang3': {
		'text': "<p>{if hisao:\nA fragt ob Sam noch studiert und holt alte Kamellen wieder hervor<br> (Schulzeit und Sam’s Inkonsequenz)<br>\nA vs Sam mit giftigen Blicken und Stäbchen rumzeigen/fuchteln\nH und Lara legen Hand auf um zu beruhigen → awkward Moment entsteht als Lara “erwischt” wird<br>\nLara verteidigt Sam bzgl. Studium etc<br>\nH ist froh und will unbedingt dass sie mit in seinem Unternehmen einsteigt/ etwas übernimmt oder dergleichen<br>\n}\n{if antonia:\nH fragt nach Sam’s Studium<br>\nSam erzählt bissl wie&#39;s läuft und Lara gibt ihren (positiven) Senf dazu<br>\nH ist froh und will unbedingt dass sie mit in seinem Unternehmen einsteigt/ etwas übernimmt oder dergleichen<br>\nA seufzt nur theatralisch wie eine beleidigte Leberwurst rum und besteht auf ihre “Model wäre besser” Meinung<br>\n}</p>\n<p>{Gang3}</p>",
		'passages': {
		},
	},
	'Gang3': {
		'text': "<p>Geschirr wird abgeräumt während weiter gequatscht wird<br>\n<br>\nA labert das H einen Timeslot da irgendwo frei hat und sie eine Show machen will, in der sie ihrer neuen Collection vorstellen will und Interviews führt mit irgendwelchen Journalisten und so<br>\ndas dann wie so ein Shoppingkanal<br>\nH fragt dann so ob Sam nicht interesse hat und ihrer Mutter helfen will<br>\nSam etwas entsetzt, sagt, sie habe ein Studium zu bewältigen, für das sie in London sein muss<br>\nH sagt, man könne auch was in London organisieren, sie waren lange nicht dort<br>\nA merkt an, dass da Fashion Week ist<br>\nSam, entsetzt, stammelt was davon, dass sie es sich überlegen muss<br>\nA/H wollen auf Sam einreden, dass sie doch mitmachen soll<br>\nSam gereizt: “I said I’ll think about it.”<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Gang3_Ueberreden\" role=\"link\" tabindex=\"0\">Überreden</a> <a class=\"squiffy-link link-section\" data-section=\"Gang3_Beruhigen\" role=\"link\" tabindex=\"0\">Beruhigen</a></p>",
		'passages': {
		},
	},
	'Gang3_Ueberreden': {
		'text': "<p>Lara redet auf Sam ein, dass es doch hilfreich wäre sowas auf ihrem Lebenslauf zu haben und sie kann mehr Erfahrung sammeln etc.<br>\n{if salarawin: <p><strong>Eltern fragen Lara, ob sie mitmachen will. Lara stammelt. Sam wirft einen “Selbst Schuld”-Blick zu.</strong></p>}\n{if parentswin: <p><strong>Sam: &quot;Gut, aber Lara kann ja auch mitmachen…” A-Weg: ”...als Model&quot;, A: &quot;oh ja&quot;, Lara: &quot;oh nein&quot;</strong></p>}\n{if tie: <p><strong>Sam: “Na gut, lasst uns später darüber reden. Okay?”</strong></p>}</p>\n<p>{Gang3_trans_Gang4}</p>",
		'passages': {
		},
	},
	'Gang3_Beruhigen': {
		'text': "<p>Lara erregt Sams Aufmerksamkeit, in dem sie ihr eine Hand auf&#39;s Bein legt<br>\nSam guckt Lara an, die ihre Augenbrauen anhebt á là &quot;Sam, stop!&quot;, und Sam beruhigt sich<br>\nLara wirft ihr noch einen ernsten Blick zu, worauf sich Sam sogar entschuldigt<br>\nA/H fällt das natürlich auf, dass Sam auf Lara hört<br>\n{if salarawin: <p><strong>Sam ergreift Laras Hand</strong></p>}\n{if parentswin: <p><strong>Sam verdreht Augen, sarkastische Entschuldigung</strong></p>}\n{if tie: <p><strong>Normale Entschuldigung ohne Hand ergreifen</strong></p>}</p>\n<p>{Gang3_trans_Gang4}</p>",
		'passages': {
		},
	},
	'Gang3_trans_Gang4': {
		'text': "<p><h2>3. Gang: Chirashi Sushi wird serviert</h2>\nH: I’m sorry. We’re ignoring our guest. Ho ho ho<br>\nH: Also Lara, Archäologie….wie läufts so mit den Vasen?<br>\nSam betont, dass es Asian Archaeology ist, Eltern fragen wieso, Lara sagt kurz was zu ihrere Faszination von asiatischer Kultur und Sam fängt als nudge nudge mit dem Füßeln an<br>\nLara erzählt etwas von ihrem Studium, vielleicht von Exkursionen/Ausgrabungen im dreckigen Erdboden (omg)<br>\nA:&quot;Oh, darling, aren&#39;t you a little bit too old for digging around in mud?&quot; ← A Humor<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Gang3_trans_Gang4_Retort\" role=\"link\" tabindex=\"0\">Retort</a> <a class=\"squiffy-link link-section\" data-section=\"Gang3_trans_Gang4_Justify\" role=\"link\" tabindex=\"0\">Justify</a></p>",
		'passages': {
		},
	},
	'Gang3_trans_Gang4_Retort': {
		'text': "<p>Lara: “At least I don’t put it on my face.”<br>\nSam: “Wtf, Lara no.”<br>\nA lacht “I like her.”<br>\nSam: “Wait wat?”<br>\n{if salarawin: <p><strong>A bei Suppenunfall: “And I don’t put soup on mine.”<br>\nSam stöhnt: “Mom…” und A rudert zurück</strong></p>}\n{if parentswin: <p><strong>Sam gibt Lara beim Füßeln einen leichten Tritt</strong></p>}</p>\n<p>{Gang4}</p>",
		'passages': {
		},
	},
	'Gang3_trans_Gang4_Justify': {
		'text': "<p>Lara fängt an zu erklären, dass das kein im Schlamm Spielen ist und was alles zu Archäologie gehört<br>\nanderen stoppen sie<br>\nA sagt, sie habe (angeblich) sehr wohl eine Ahnung, was Archäologie ist<br></p>\n<p>{Gang4}</p>",
		'passages': {
		},
	},
	'Gang4': {
		'text': "<p>Sam platzt gleich rein und fängt an Lara Lobhymnen zu singen (fleißig, viele Credits gesammelt, Profs begeistert)<br>\nDann meint Sam, dass sie gar nicht weiß, wie Lara das alles hinkriegt, weil sie noch so viele andere tolle Dinge macht → erzählt von Laras Hobbies<br>\nA/H stellt Frage zu einem der Hobbies, Lara erzählt kurz was darüber<br>\n{if salarawin: </p>\n<p><p><strong>Sam voll in Fahrt mit ihrer Prahlerei erhebt ihr Glas und will auf “Awesome Lara” anstoßen<br>\nA/H amüsiert und tauschen wissende Blicke aus<br>\nH steigt mit einem “to a good catch” ein und A mit einem “she sure is a keeper”<br>\n</strong></p>\n}\n{if parentswin: </p>\n<p><p><strong>Sam haut noch raus, dass Lara aus noblem Haus ist<br>\nFalls Sam vorher Lara getreten hat, will Lara ihr einen leichten “hey was machst du da?!” Tritt geben, trifft dabei Tischbein und bringt den zum Wackeln, Lara winselt, Sam kichert<br>\nPeinliche Pause bis A raushaut: “So how long has this be going on between you two?”<br>\n</strong></p>\n}\n{if tie: </p>\n<p><p><strong>Sam erwähnt zusätzlich noch die vielen Jobs, die sie meistert<br>\nLara, die Tomate, sinkt tiefer im Stuhl und murmelt irgendwas wie “Sam stop, I don’t think your parents want to hear all that…”<br>\nA: “Yeah darling you should stop, your girlfriend is about to combust.”<br>\n</strong></p>\n}</p>\n<p>Sam: wait wat?<br>\nLara: wat?<br></p>\n<p>Geschirr wird abgeräumt <br></p>\n<p>{Gang4_trans_final}</p>",
		'passages': {
		},
	},
	'Gang4_trans_final': {
		'text': "<p><h2>4. Gang: Yuzu crème brûlée wird serviert</h2>\nSam seufzt und meint eher so ein &quot;here we go&quot; weil sie das schlimmste erwartet<br>\nsackt im Stuhl zusammen nach dem Anstoßen<br>\nA so: Was?<br>\nSam: Na los, komm schon. Aber können wir bitte das Verhör überspringen? &quot;Lara&#39;s a good girl&quot; oder sowas, fängt automatisch an, Lara zu verteidigen, steigert sich da rein, führt quasi die ganze Unterhaltung alleine. <br>\nUnd H/A nur so: Wir haben doch gar nichts gesagt<br>\nH will sie unterbrechen, aber Sam würgt H ab und redet weiter, bis A halt &quot;Darling stop&quot;<br>\nSam tauscht mit Eltern Blicke aus bis sie merkt was Sache ist<br>\nSam  &quot;i hate you guys&quot; aka das ist doch jetzt nicht euer ernst, ihr lasst mich all die jahre abblitzen und JETZT auf einmal ist alles okay und überhaupt aber ihr mögt Lara und omg trotzdem danke, schnieft schon dabei rum T_T<br>\nA zwinkert dann nur so, greift nach ihrer Hand auf dem Tisch um die zu squeezen und erwidert &quot;we love you too darling&quot;<br>\nSam: “Okay this is too much for me. Excuse me.” Verschwindet ins Bad<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Antrag\" role=\"link\" tabindex=\"0\">Kapitel 4</a> </p>",
		'passages': {
		},
	},
	'Antrag': {
		'text': "<p><h1>Kapitel 4: Antrag</h1>\nLara nutzt die Zeit die Eltern zu fragen in Sachen Antrag und was sie vor hat<br>\nLara sagt A/H, sie muss etwas mit ihnen besprechen<br>\nH lädt sie dazu ein, sich mit ihnen an den Kamin zu setzen<br>\nÁ là &quot;Könnten Sie es sich vorstellen, es jemandem wie mir zu erlauben sie irgendwann zu heiraten?&quot;<br>\nA sagt &quot;omg wirklich? einen Antrag?&quot;<br>\nLara: &quot;yes...no..I mean....:0&quot; und dann erklärt sie, dass mit dem später und dass sie die Gelegenheit aber nutzen wollte um die klischeehafte Erlaubnis/Segen zu beten<br>\nA: &quot;Omg. Do you have a ring?&quot;<br>\nLara: &quot;Err, well, yes&quot;<br>\nA: &quot;Where? Can I see, eeeeeee&quot;<br>\nLara: &quot;Well, it&#39;s in my travel bag. As I said, I didn&#39;t want to do it now actually, just asking for permission&quot;<br>\nA: &quot;NO WAY.&quot;<br>\nLara muss sich nun entscheiden dun dun dun<br></p>\n<p>FAILPOINTS: {fail}</p>\n<p>{if not salarawin:\n<a class=\"squiffy-link link-section\" data-section=\"Antonia_way\" role=\"link\" tabindex=\"0\">A-Saft</a> }\n{else:</p>\n<p><p><strong>Ausgegrauter A-Saft Link</strong></p>\n}</p>\n<p>{if fail=2:\n{if chopsticks:</p>\n<p><p><strong>Ausgegrauter L-Word Link</strong></p>\n}\n}\n{else:\n<a class=\"squiffy-link link-section\" data-section=\"Lara_way\" role=\"link\" tabindex=\"0\">L-Word</a>\n}</p>\n<p>{if not parentswin:\n<a class=\"squiffy-link link-section\" data-section=\"Hisao_way\" role=\"link\" tabindex=\"0\">H-Milch</a>}\n{else:</p>\n<p><p><strong>Ausgegrauter H-Milch Link</strong></p>\n}</p>",
		'passages': {
		},
	},
	'Antonia_way': {
		'text': "<p>H lenkt Sam ab, während A und Lara Rosenblätter und Kerzen in Laras Zimmer vorbereiten<br>\nA sagt ihr, sie soll es machen, wenn die beiden dann auf &quot;ihre Zimmer&quot; gehen<br>\nund Lara soll sich doch etwas Mühe geben, sie mental schon mal drauf vorzubereiten, also zärtlich sein und so<br>\nSam sagt omg yes und plötzlich hören die lautes Quieken von A vor der Tür<br>\nSam nur wtf, Mom…<br>\n<br>\nA platzt rein, zieht H mit sich<br>\nmacht Familienfoto mit Selbstauslöser<br>\n<br>\nSam sagt, es war sehr viel für einen Tag, sie will jetzt ihre Ruhe haben, scheucht A/H aus dem Zimmer<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Epilog\" role=\"link\" tabindex=\"0\">Epilog</a> </p>",
		'passages': {
		},
	},
	'Hisao_way': {
		'text': "<p>H arrangiert mit Hilfe von Angestellten draußen im Schnee einen Schriftzug mit der Lichterkette<br>\nLara soll Sam im Zimmer auf den Balkon führen<br>\nLara soll dann Zeichen geben, wenn die Kette angemacht werden soll<br>\nentweder gehen dann einige Lampen futsch weil Schnee und Wasser oder die Angestellten legen irgendwas falsch oder komisch, sodass alles andere als Marry Me rauskommt<br></p>\n<ul>\n<li>Feuerwerk, dass H noch parat hatte<br>\nSam: “Wtf”<br>\nH wirft Schneebälle auf die Angestellten die es versaut haben<br>\nA ist auf benachbarten Balkon zum Filmen und Kommentieren<br>\n<br>\nA platzt ins Zimmer - H kommt später nach - wollen wissen, wie’s gelaufen ist<br>\nmachen Familienfoto mit Selbstauslöser<br></li>\n</ul>\n<p>Sam sagt, es war sehr viel für einen Tag, sie will jetzt ihre Ruhe haben, scheucht A/H aus dem Zimmer<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Epilog\" role=\"link\" tabindex=\"0\">Epilog</a> </p>",
		'passages': {
		},
	},
	'Lara_way': {
		'text': "<p>Lara besteht darauf, dass sie den richtigen Zeitpunkt abwarten will und nur erst mal nach der Erlaubnis fragen wollte<br>\nA/H sind damit einverstanden, dass sie es machen kann, wann sie will<br>\nAber A will unbedingt den Ring mal sehen, um zu sehen ob er ihrer Tochter würdig ist<br>\nWenn Lara mit Ring wieder da ist, kommt Sam zurück<br>\nA ist so aufgedreht, dass Lara, voll nervös, doch nicht drumrum kommt den Antrag gleich zu machen<br>\nA grinst breit und nickt dann Lara ermutigend zu<br>\nH versucht A zu beruhigen, schafft es aber nicht<br>\naber A platzt, Lara auch, dann platzt es aus Lara raus, dann platzt Sam<br>\nA und H zücken Handys um zu filmen, A ist ständig in Hs Bild<br>\n<br></p>\n<p>{if salarawin:\nFoto verwackelt<br>\nClicken zum weiterlesen<br>\nA: What have you done? Make another photo, properly this time<br>\nBild wird aktualisiert<br>\n}</p>\n<p>Sam sagt, es war sehr viel für einen Tag, sie will jetzt ihre Ruhe haben, Schluss für heute<br>\nzerrt Lara auf Zimmer<br></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"Epilog\" role=\"link\" tabindex=\"0\">Epilog</a> </p>",
		'passages': {
		},
	},
	'Epilog': {
		'text': "<p><h1>Epilog</h1>\ndie brechen erschöpft erstmal zusammen aufs Bett<br>\nSam starrt Ring an, &quot;can&#39;t believe you just did that&quot;<br>\nnoch ne Unterhaltung, die mit dem Titel Family Matters zu tun hat, wo sie z.B. auf das Anfangsgespräch im Auto zu sprechen kommen, wo Sam Lara ewig vor ihren Eltern gewarnt hat und wovor sie alles Angst hatte was ihre Eltern angeht... und dass es doch anders gekommen ist oder so, und ja, swoonen, und tja, dass Sams wieder ein wenig näher gekommen ist, nachdem sie auseinander brach, bevor sie nach London kam? Dass Lara wieder eine Familie hat?<br>\nSinnlose Entscheidung am Ende, was dann von Sam nur mit irgendwas albernem kommentiert wird.<br></p>",
		'passages': {
		},
	},
}
})();