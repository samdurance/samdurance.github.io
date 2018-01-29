// Created with Squiffy 5.1.0
// https://github.com/textadventures/squiffy

(function () {
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
                    if ('@last' in squiffy.story.section.passages && squiffy.get('_turncount') >= squiffy.story.section.passageCount) {
                        squiffy.story.passage('@last');
                    }
                } else if (section) {
                    //currentSection.append('<hr/>');
                    disableLink(link);
                    section = processLink(section);
                    squiffy.story.go(section);
                } else if (rotateAttr || sequenceAttr) {
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
            link.addClass('invisible');
            link.siblings('.tr__question').addClass('invisible');
            link.attr('tabindex', -1);
        }

        squiffy.story.begin = function () {
            if (!squiffy.story.load()) {
                squiffy.story.go(squiffy.story.start);
            }
        };

        var processLink = function (link) {
            link = String(link);
            var sections = link.split(',');
            var first = true;
            var target = null;
            sections.forEach(function (section) {
                section = section.trim();
                if (startsWith(section, '@replace ')) {
                    replaceLabel(section.substring(9));
                } else {
                    if (first) {
                        target = section;
                    } else {
                        setAttribute(section);
                    }
                }
                first = false;
            });
            return target;
        };

        var setAttribute = function (expr) {
            var lhs, rhs, op, value;
            var setRegex = /^([\w]*)\s*=\s*(.*)$/;
            var setMatch = setRegex.exec(expr);
            if (setMatch) {
                lhs = setMatch[1];
                rhs = setMatch[2];
                if (isNaN(rhs)) {
                    squiffy.set(lhs, rhs);
                } else {
                    squiffy.set(lhs, parseFloat(rhs));
                }
            } else {
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
                } else {
                    value = true;
                    if (startsWith(expr, 'not ')) {
                        expr = expr.substring(4);
                        value = false;
                    }
                    squiffy.set(expr, value);
                }
            }
        };

        var replaceLabel = function (expr) {
            var regex = /^([\w]*)\s*=\s*(.*)$/;
            var match = regex.exec(expr);
            if (!match) return;
            var label = match[1];
            var text = match[2];
            if (text in squiffy.story.section.passages) {
                text = squiffy.story.section.passages[text].text;
            } else if (text in squiffy.story.sections) {
                text = squiffy.story.sections[text].text;
            }
            var stripParags = /^<p>(.*)<\/p>$/;
            var stripParagsMatch = stripParags.exec(text);
            if (stripParagsMatch) {
                text = stripParagsMatch[1];
            }
            var $labels = squiffy.ui.output.find('.squiffy-label-' + label);
            $labels.fadeOut(1000, function () {
                $labels.html(squiffy.ui.processText(text));
                $labels.fadeIn(1000, function () {
                    squiffy.story.save();
                });
            });
        };

        squiffy.story.go = function (section) {
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

        squiffy.story.run = function (section) {
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

        squiffy.story.passage = function (passageName) {
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

        var processAttributes = function (attributes) {
            attributes.forEach(function (attribute) {
                if (startsWith(attribute, '@replace ')) {
                    replaceLabel(attribute.substring(9));
                } else {
                    setAttribute(attribute);
                }
            });
        };

        squiffy.story.restart = function () {
            if (squiffy.ui.settings.persist && window.localStorage) {
                var keys = Object.keys(localStorage);
                jQuery.each(keys, function (idx, key) {
                    if (startsWith(key, squiffy.story.id)) {
                        localStorage.removeItem(key);
                    }
                });
            } else {
                squiffy.storageFallback = {};
            }
            if (squiffy.ui.settings.scroll === 'element') {
                squiffy.ui.output.html('');
                squiffy.story.begin();
            } else {
                location.reload();
            }
        };

        squiffy.story.save = function () {
            squiffy.set('_output', squiffy.ui.output.html());
        };

        squiffy.story.load = function () {
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

        var setSeen = function (sectionName) {
            var seenSections = squiffy.get('_seen_sections');
            if (!seenSections) seenSections = [];
            if (seenSections.indexOf(sectionName) == -1) {
                seenSections.push(sectionName);
                squiffy.set('_seen_sections', seenSections);
            }
        };

        squiffy.story.seen = function (sectionName) {
            var seenSections = squiffy.get('_seen_sections');
            if (!seenSections) return false;
            return (seenSections.indexOf(sectionName) > -1);
        };

        squiffy.ui = {};

        var currentSection = null;
        var screenIsClear = true;
        var scrollPosition = 0;

        var newSection = function () {
            if (currentSection) {
                disableLink(jQuery('.squiffy-link', currentSection));
            }
            var sectionCount = squiffy.get('_section-count') + 1;
            squiffy.set('_section-count', sectionCount);
            var style = 'display:none;';
            var name = 'squiffy-section';
            var id = 'squiffy-section-' + sectionCount;
            currentSection = jQuery('<div/>', {
                style: style,
                id: id,
                class: name,
            }).appendTo(squiffy.ui.output).slideDown('slow', function () {
                $('html,body').animate({
                    scrollTop: $(this).offset().top - 100
                }, 3000, 'easeInOutExpo');
            });
            squiffy.set('_output-section', id);
        };

        squiffy.ui.write = function (text) {
            screenIsClear = false;
            scrollPosition = squiffy.ui.output.height();
            currentSection.html(squiffy.ui.processText(text));
            squiffy.ui.scrollToEnd();
        };

        squiffy.ui.clearScreen = function () {
            squiffy.ui.output.html('');
            screenIsClear = true;
            newSection();
        };

        squiffy.ui.scrollToEnd = function () {
            var scrollTo, currentScrollTop, distance, duration;
            if (squiffy.ui.settings.scroll === 'element') {
                scrollTo = squiffy.ui.output[0].scrollHeight - squiffy.ui.output.height();
                currentScrollTop = squiffy.ui.output.scrollTop();
                if (scrollTo > currentScrollTop) {
                    distance = scrollTo - currentScrollTop;
                    duration = distance / 0.4;
                    squiffy.ui.output.stop().animate({
                        scrollTop: scrollTo
                    }, duration);
                }
            } else {
                scrollTo = scrollPosition;
                currentScrollTop = Math.max(jQuery('body').scrollTop(), jQuery('html').scrollTop());
                if (scrollTo > currentScrollTop) {
                    var maxScrollTop = jQuery(document).height() - jQuery(window).height();
                    if (scrollTo > maxScrollTop) scrollTo = maxScrollTop;
                    distance = scrollTo - currentScrollTop;
                    duration = distance / 0.5;
                    jQuery('body,html').stop().animate({
                        scrollTop: scrollTo
                    }, duration);
                }
            }
        };

        squiffy.ui.processText = function (text) {
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
                            } else {
                                nestCount--;
                                searchStart = nextClose + 1;
                                if (nestCount === 0) {
                                    close = nextClose;
                                    containsUnprocessedSection = true;
                                    finished = true;
                                }
                            }
                        } else {
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
                } else if (startsWith(text, 'else:')) {
                    return processTextCommand_Else(text, data);
                } else if (startsWith(text, 'label:')) {
                    return processTextCommand_Label(text, data);
                } else if (/^rotate[: ]/.test(text)) {
                    return processTextCommand_Rotate('rotate', text, data);
                } else if (/^sequence[: ]/.test(text)) {
                    return processTextCommand_Rotate('sequence', text, data);
                } else if (text in squiffy.story.section.passages) {
                    return process(squiffy.story.section.passages[text].text, data);
                } else if (text in squiffy.story.sections) {
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
                } else {
                    var checkValue = true;
                    if (startsWith(condition, 'not ')) {
                        condition = condition.substring(4);
                        checkValue = false;
                    }

                    if (startsWith(condition, 'seen ')) {
                        result = (squiffy.story.seen(condition.substring(5)) == checkValue);
                    } else {
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
                } else {
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

        squiffy.ui.transition = function (f) {
            squiffy.set('_transition', f.toString());
            f();
        };

        squiffy.storageFallback = {};

        squiffy.set = function (attribute, value) {
            if (typeof value === 'undefined') value = true;
            if (squiffy.ui.settings.persist && window.localStorage) {
                localStorage[squiffy.story.id + '-' + attribute] = JSON.stringify(value);
            } else {
                squiffy.storageFallback[attribute] = JSON.stringify(value);
            }
            squiffy.ui.settings.onSet(attribute, value);
        };

        squiffy.get = function (attribute) {
            var result;
            if (squiffy.ui.settings.persist && window.localStorage) {
                result = localStorage[squiffy.story.id + '-' + attribute];
            } else {
                result = squiffy.storageFallback[attribute];
            }
            if (!result) return null;
            return JSON.parse(result);
        };

        var startsWith = function (string, prefix) {
            return string.substring(0, prefix.length) === prefix;
        };

        var rotate = function (options, current) {
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
                    persist: false,
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
            },
            begin: function () {
                squiffy.story.begin();
            }
        };

        jQuery.fn.squiffy = function (methodOrOptions) {
            if (methods[methodOrOptions]) {
                return methods[methodOrOptions]
                    .apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
                return methods.init.apply(this, arguments);
            } else {
                jQuery.error('Method ' + methodOrOptions + ' does not exist');
            }
        };
    })();

    var get = squiffy.get;
    var set = squiffy.set;


    squiffy.story.start = 'setvariables';
    squiffy.story.id = '75486b01cb';
    squiffy.story.sections = {
        'setvariables': {
            'text': "{introduction}",
            'attributes': ["SC = 0", "PC = 0", "fail = 0", "not salarawin", "not parentswin", "not tie", "not carkiss",
            "not greetingfail", "antonia", "not clothes", "not compliment", "not samstory", "not sammad", "not samclothes",
            "not interrupt", "hisao", "not tease", "not roof", "not samhelp", "not tool", "not drink2", "not accident",
            "not accident_involve", "not chopsticks", "not spoon"],
            'passages': {},
        },
        'introduction': {
            'text': "" +
                "<div class=\"tr__introductionblock\">" +
            "<p class=\"tr__bookcover__para--mobile hidden-lg hidden-md hidden-sm\">An interactive S.S.Endurance story</p>" +    
            "<a class=\"squiffy-link first link-section\" id=\"start\" data-section=\"start\" role=\"link\" tabindex=\"0\">Start Teaser</a>" +
                "</div>"
        },
        'start': {
            'text': "" +
                "<article id=\"cb01\" class=\"tr__contentblock is-active\">" +

            "<header class=\"tr__chapter__header slideInUp\">" +
            "<h1 class=\"tr__headline--large tr__chapter__headline\">Chapter 1: Arrival</h1>" +
            "</header>" +

            "<div class=\"tr__contentblock__wrapper\">" +

                "<section class=\"tr__chapter__section\">" +

                 "<div class=\"tr__textwrap\">" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "There’s an old Japanese proverb about parents that…" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "No, I couldn’t actually think of one. I couldn’t think about much at that moment, other than the fact that we were heading to meet and spend an entire week with Sam’s parents in their residence near Tokyo." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "My arm twitched with the need to reach for Sam’s hand for comfort, but she was soundly asleep on the other side of the back seat. I didn’t know how she’d managed to nap again in the car after having already slept through the entire twelve hour flight. I was a tad jealous, actually. The jet lag affected me as well, but I was too worked up to rest." +
                    "</p>" +

                    "<p class=\"tr__para slideInUp \">" +
                    "I looked out of the side window at the grey sky and the white landscape that had been covered in fresh snow. With the snowfall having died down, it seemed like we were the only thing moving amidst the frozen countryside. It was a peaceful scenery. A cold and peaceful scenery." +
                    "</p>" +
                 
            
                    "<a class=\"tr__polaroid__link slideInUp \" href=\"#\" data-featherlight=\"img/story/lara_landscape.jpg\">" +
                    "<div class=\"tr__polaroid left\">" +
                    "<img src=\"img/story/lara_landscape_pola.jpg\" class=\"img-responsive\" />" +
                    "</div>" +
                    "</a>" +


                    "<p class=\"tr__para slideInUp \">" +
                    "“Why is there a swimsuit in my bag?” I murmured and ran a sleeve over the breath-clouded window. Sam’s snoring stopped. Her leather jacket rustled as she stirred." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Jacuzzi,” she groaned, zombie-like. Her eyes were still closed." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Right.” I didn't see the appeal yet in going for a bath in the freezing cold." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Sam gave my leg a lazy slap. “Right,” she said, imitating my speech. It came out more as a long yawn. “You’ll see.” She pulled her jacket close, wrapped her arms around herself, and rolled over to find a position in which she could sleep." +
                    "</p>" +

                    "<p class=\"tr__para slideInUp \">" +
                    "I looked at her with raised brows and felt a cold chill run over my skin. Against my protests, the short leather jacket was all she’d put on over her jumper. I probably looked like the marshmallow man next to her, but at least I’d been comfortably warm when we’d left the plane — unlike her. It was actually colder in Japan than back in London. Fortunately, the car Sam’s parents had sent to pick us up was warm." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“You should’ve dressed more warmly.” When Sam only scoffed, I added, “Or do you want your mother to tend to you while you’re ill in bed?” Sam’s exaggerated, disgusted face made me chuckle." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“I’ll be fine. You can keep me warm though if you’re worried.” While she gave me a tired but persistent smirk, I gave the driver a worried glance. “Just some friendly cuddling,” she said. “It was a stupid idea not to sit together.”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“It was your idea,” I reminded her." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Well, in theory it was a good one.” She grinned half-heartedly before pointing at the front seat with a shrug. “He’s just the driver. And when we arrive, we’ll simply sit apart again. Seriously, we’re going to spend an entire week with my parents. I really need some good cuddles now.”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Sighing, I turned to her with a resigned smile. With swift movements belying her tired look, Sam opened her seat belt and re-belted up in the middle of the back seat. She snuggled into me as we locked arms. I preferred it that way as well. Sam made me feel a kind of warmth the car heater couldn’t provide. I relaxed into her until Sam’s smug smirk caught my attention." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“What?”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Loved the stupid grin you just had,” she chuckled, now sporting one herself. I was about to roll my eyes at her, but then her face fell and she put her head back on my shoulder. “I really wanna kiss you right now,” she muttered." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“<i>You</i> said it’s better if your parents don’t know yet that we’re...”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“I know, I know,” she sighed. “It is for the better. They’ll take you apart and then put you through the meat grinder if I tell them you’re my girlfr—”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "My hand was over her mouth in an instant. “Psst,” I said, glancing at the driver again." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Sam plucked my hand off her face. “Dude! You’re too paranoid. He probably doesn’t even understand us. Don’t make me more nervous than I already am.”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "It was true that he’d only spoken in Japanese with Sam when he’d picked us up, but still... “I’m just… careful.”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Just. The. Driver,” she said pointedly and looked at me as if her words were meant to reassure me. “Anyways. I was saying the words girlfriend and boyfriend instantly raise red flags for my parents. I mean, I don’t blame them, I guess. Had I been my daughter, I would’ve kicked me out way sooner than they did.”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“You were young and daft,” I said jokingly and gave her a squeeze." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Snorting, she slapped my leg again. “And now… I’m just older.” She pulled a disgusted face." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "I had to chuckle but also admit I was proud of her that she was able to reflect on herself like that. To say her youth had been wild would be far from an exaggeration, but she’d grown quite a lot in the three years since we’d first met — as a person and on me." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Sam was smiling at me again. “So, considering how much we’ll have to hold back in the next days, we should totally make out now.” Her smile had turned into a grin. “Just ignore the driver,” she said and leant in." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Hesitating for a moment, I held her back and took another, nervous look at the front seat." +
                    "</p>" +
        

                    "<div class=\"tr__btnwrap slideInUp \">" +
                    "<h2 class=\"tr__question\"><span class=\"fa fa-map-signs tr__icon\"></span>Kiss the girl?</h2>"+
                    "<a class=\"squiffy-link link-section\" data-section=\"Carkiss yes\" role=\"link\" tabindex=\"0\">Yes</a>" +
                    "<a class=\"squiffy-link link-section\" data-section=\"Carkiss no\" role=\"link\" tabindex=\"0\">No</a>" +
                    "</div>" +

                  "</div>" +

                "</section>" +
            "</div>" +



                "</article>",
            'passages': {},
        },
        'Carkiss yes': {
            'text': "" +
                "<article id=\"slide01\" class=\"tr__slide tr__slide01 qt angled-both-left-right\">" +
                "<span class=\"fa fa-map-signs tr__quote__icon\"></span>" +
            "<div class=\"tr__slide01__bcg\"></div>" +
                "<div class=\"tr__slide01__wrapper\">" +
                "<section>" +
                "<blockquote class=\"tr__quote\">" +
                "<p class=\"tr__quote__para\">" +
                "A quick kiss surely wouldn’t hurt. Maybe Sam was right. It was impossible to resist her hopeful look, anyway." +
                "</p>" +
                "</blockquote>" +
                "</section>" +
                "</div>" +
            
                "</article>" +
            
                "<article id=\"cb02\" class=\"tr__contentblock\">" +

                "<div class=\"tr__contentblock__wrapper\">" +

                        "<section class=\"tr__chapter__section\">" +

                        "<div class=\"tr__textwrap\">" +

                        "<p class=\"tr__para slideInUp \">" +
                        "My eyes focused on Sam and her soft lips." +
                        "</p>" +

                        "<p class=\"tr__para slideInUp \">" +
                        "Her face lit up, probably because I had some easily to read look on my face." +
                        "</p>" +

                        "<p class=\"tr__para slideInUp \">" +
                        "Our lips met and, for a moment, I forgot my nervousness about the upcoming week." +
                        "</p>" +

                        "<p class=\"tr__para slideInUp \">" +
                        "We’d been together for almost three years, and even the briefest moments of intimacy with Sam still gave me fuzzy feelings." +
                        "</p>" +

                        "<p class=\"tr__para slideInUp \">" +
                        "The happy sigh I couldn’t hold back made Sam press herself more into me and the kiss." +
                        "</p>" +

                        "<p class=\"tr__para slideInUp \">" +
                        "“Sam,” I murmured and she reluctantly broke away." +
                        "</p>" +

                        "<p class=\"tr__para slideInUp \">" +
                        "“Okay, okay.” Looking quite pleased, she made herself comfortable again." +
                        "</p>" +
        

                               "<a class=\"tr__moviebox__link\" href=\"#\" data-featherlight=\"img/story/carkiss_yes.gif\">" +
                            "<div class=\"tr__movie__wrapper right\">" +
                            "<div class=\"tr__movie__box\">" +
                            "<div class=\"tr__movie__boxes\">" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "</div>" +
                            "<div class=\"tr__movie__center_box carkiss__yes\"></div>" +
                            "<div class=\"tr__movie__boxes\">" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "</div>" +
                            "</div>" +
                            "</div>" +
                            "</a>" +
                

                            "{Carkiss more}" +
                        "</div>" +
                        "</section>" +
                "</div>" +

                

                "</article>",
            'attributes': ["carkiss"],
            'passages': {},
        },
        'Carkiss no': {
            'text': "" +
                "<article id=\"slide01\" class=\"tr__slide tr__slide01 qt angled-both-right-left\">" +
            "<span class=\"fa fa-map-signs tr__quote__icon\"></span>" +
                "<div class=\"tr__slide01__bcg\"></div>" +
                "<div class=\"tr__slide01__wrapper\">" +
                "<section>" +
                "<blockquote class=\"tr__quote\">" +
                "<p class=\"tr__quote__para\">" +
                "There was too much at stake. The impression Sam had given of her mother was that she’d interrogate the driver later whether anything had happened." + 
                "</blockquote>" +
                "</section>" +
                "</div>" +
                "</article>" +

            "<article id=\"cb02\" class=\"tr__contentblock\">" +


                 "<div class=\"tr__contentblock__wrapper\">" +

                        "<section class=\"tr__chapter__section\">" +

                        "<div class=\"tr__textwrap\">" +
                
                          
                            "<p class=\"tr__para slideInUp \">" +
                            "“Sam, please. Stick to the plan,” I said in a low tone and tried to dodge her advances by pressing myself against the door." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "“Stupid plan,” she muttered and looked like she was going to put her head back on my shoulder." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "She froze, flashed a mischievous smirk, and then latched onto my exposed neck." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "“Sam, no!” She’d caught me off-guard." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "“Sam, yes,” she murmured against me." +
                            "</p>" +

                            "<p class=\"tr__para slideInUp \">" +
                            "I tried to push her away as she kissed my sensitive skin, but that just made her bite onto my neck more firmly. A shiver ran down my spine." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "It was only when I surrendered to the pleasure and stopped struggling that she stopped giggling and mauling me." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "“Mmh,” she made with a broad smile." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "“Are you done?” My voice was shaky." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "“It’ll do for now.” Snickering, she made herself comfortable again while I composed myself." +
                            "</p>" +
            
                            "<p class=\"tr__para slideInUp \">" +
                            "Hoping that Sam hadn’t foiled our plans, I at least took comfort in her looking happy." +
                            "</p>" +
            
            

                               "<a class=\"tr__moviebox__link\" href=\"#\" data-featherlight=\"img/story/carkiss_no.gif\">" +
                            "<div class=\"tr__movie__wrapper right\">" +
                            "<div class=\"tr__movie__box\">" +
                            "<div class=\"tr__movie__boxes\">" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "</div>" +
                            "<div class=\"tr__movie__center_box carkiss__no\"></div>" +
                            "<div class=\"tr__movie__boxes\">" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "<span class=\"tr__movie__small_box\"></span>" +
                            "</div>" +
                            "</div>" +
                            "</div>" +
                            "</a>" +
            
                            "{Carkiss more}" +
                        "</div>" +
                        "</section>" +
                "</div>" +

                "</article>",
            'passages': {},
        },
        'Carkiss more': {
            'text': "" +
                    "<p class=\"tr__para slideInUp \">" +
                    "“I’m so glad you came with me,” she said." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“But, of course.” I gave her another gentle squeeze." +
                    "</p>" +
                    
                    "<p class=\"tr__para slideInUp \">" +
                    "She glanced at me with a heart-warming smile before her expression became serious again. “We really have to make my parents like you before we let them know about us. So, behave yourself!” She gave me an intense look and waved her finger at me. I scoffed, and Sam poked my well-padded shoulder in response. “I’m serious. Like—“" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“I always behave myself.” My head heated up a tad from Sam’s accusing tone. I was short of adding ‘unlike you’." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Like — don’t interrupt anyone.” Sam’s smug look made me sigh. Slumping, I mentally braced myself for what I knew I was in for now that I’d accidentally proven her point." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Especially not my mom,” she began. “But neither Dad, really. And, no,” she rose her finger at me again, “that doesn’t mean you get to keep quiet. Make conversation. Show some interest. Mom’s a sucker for compliments, but don’t overdo it, or I’ll throw up.” Sam paused to shudder. “Ask questions. Dad has all this old stuff standing around. Maybe you can whip out your archeological super powers and you can bond over that and become best buddies. But don’t. Break. Anything.” Sam had put on her serious face for that." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Rolling my eyes, I turned to look out the window with warm cheeks." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“It’s mostly Mom, really. You’ll have to be extra careful with her. Are you listening?”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Yeah, yeah.”" +
                    "</p>" +            
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Lara…” She waited until I looked at her again. “This is important. It’s important to me.”" +
                    "</p>" +            
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“I know,” I sighed." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“I want them to take you serious. To take us serious. This is on me that we have to deal with this but, please, just help me here.” She gave me a pleading look." +
                    "</p>" +
            
                     "<p class=\"tr__para slideInUp \">" +
                    "“I will. Don’t worry. I’ll give my best.”" +
                    "</p>" +           
            
                    "<p class=\"tr__para slideInUp \">" +
                    "Sam raised an eyebrow at me. “We’re so doomed.”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "I scoffed at her while my hand sneaked under her jacket and pinched her ticklish side." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“I was joking!” she squealed and giggled, throwing up her hands to yield." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“But I wasn’t,” I told her after she’d calmed down. “I promise I’ll do my best.”" +
                    "</p>" +
            
            
            
                    "<a class=\"tr__polaroid__link slideInUp slideInUp5\" href=\"#\" data-featherlight=\"img/story/carsnuggle.jpg\">" +
                    "<div class=\"tr__polaroid left\">" +
                    "<img src=\"img/story/carsnuggle_pola.jpg\" class=\"img-responsive\" />" +
                    "</div>" +
                    "</a>" +
            
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Thanks, sweetie.” Seemingly placated, Sam put her head back on my shoulder and cuddled into me. She’d been quite on edge because of the visit to her parents. I wanted to tell her that it wasn’t going to be the end of anything should it go south, but I had my own reasons why that week was important." +
                    "</p>" +
      
                    "<p class=\"tr__para slideInUp \">" +
                    "Besides, we’d been through thick and thin in those past college years, always coming through and growing closer, I thought as I cradled the girl in my arms. How bad could be a week with Sam’s parents?" +
                    "</p>" +          
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Oh,” she piped up from my shoulder, pulling me out of my thoughts, “and for the sake of everything that is holy, please don’t touch the chopsticks during dinner. I still have nightmares from the last time you tried to use them.” She clung to my arm with a look of horror on her face." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "I groaned at her reaction, but my head noticeably heated up. “So,” I said and quickly changed the topic, “are you sure your parents don’t know about us?”" +
                    "</p>" +          
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“Why should they?”" +
                    "</p>" +
      
                    "<p class=\"tr__para slideInUp \">" +
                    "“Well, weren’t you quite persistent about bringing me with you?”" +
                    "</p>" +          
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“They know you’re my roomie and best friend. Should be fine. I hope.”" +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“What about all the pictures you post of us?”" +
                    "</p>" +             
            
                      "<p class=\"tr__para slideInUp \">" +
                    "Sam shrugged. “Most of the ones I put online are kinda ambiguous, I guess?” Ignoring my incredulous glance, she continued, “Besides, with how busy they are, their feeds must be clustered. I mean, you know Dad’s a media mogul and Mom and her model agency? And I think her fashion label is gonna release a new collection soon-ish. I’m sure they have way better things to do than to look at my crap. They never really cared about what I did, anyway.”" +
                    "</p>" +
      
                    "<p class=\"tr__para slideInUp \">" +
                    "“Oh, Sam…” I wanted to say something comforting, but she just shrugged again." +
                    "</p>" +          
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“I haven’t seen them for more than a day at a time since I started college. And now an entire week. I just hope…” As she trailed off and took a deep breath, her hand sneaked onto my thigh to stroke it slowly." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“We’ll be fine. We’ve survived worse.”" +
                    "</p>" + 
            
                     "<p class=\"tr__para slideInUp \">" +
                    "“You say that now,” Sam chuckled and then exhaled at length. “It’s gonna suck acting all gal pal-ish until I’m sure they like you. Oh!” Something caught her attention. She looked past me out the window as the car slowed down to turn into a pathway. “Guess we can start practicing.”" +
                    "</p>" +          
            
                    "<p class=\"tr__para slideInUp \">" +
                    "As we drove up a hill, a bright light could be seen in the distance through trees lining the road. It almost looked as if something was on fire. I gave Sam a worried glance." +
                    "</p>" +
            
                    "<p class=\"tr__para slideInUp \">" +
                    "She groaned. “Dad and his Christmas lights. I’m surprised Mom hasn’t made him take them down yet. Anyway,” she said and pecked my cheek, “see you on the other side. Good luck.”" +
                    "</p>" +   
            
            
                    "{if not carkiss:<p class=\"tr__para slideInUp \">" +
                    "She was about to change seats but noticed something on my neck that made her halt. Staring at me, she pulled her lips between her teeth so as to not laugh." +
                    "</p>" +
            
                     "<p class=\"tr__para slideInUp \">" +
                    "“What?” I reflexively turned my head as if I’d be able to look at my own neck." +
                    "</p>" +   
            
                    "<p class=\"tr__para slideInUp \">" +
                    "“You may or may not have a hickey there.” Sam grinned while I had a light panic attack. “Don’t worry,” she said and readjusted my scarf. “I’ll cover it up with some make-up later. Just, ugh, hide it for now.”" +
                    "</p>" +   
            
                         
                    "<p class=\"tr__para slideInUp \">" +
                    "“Great,” I muttered, fiddling with the collar of my jacket." +
                    "</p>}" +   
            
            
                     "<p class=\"tr__para slideInUp \">" +
                    "Sam unbuckled and took place on the other side of the backseat again." +
                    "</p>" + 
            
                     "<p class=\"tr__para slideInUp \">" +
                    "Leaving the tree-lined pathway behind, a modern, yet still traditionally Japanese looking, two-storeyed residence came into view whose front was plastered with rows of Christmas lights in all kinds of colours. We pulled up to a garage door and came to a halt next to a glowing reindeer figure." +
                    "</p>" +         
            
                     "<p class=\"tr__para slideInUp \">" +
                    "Sam looked at me nervously and said,  “Love you.” It sounded like a farewell as if some catastrophe was about to happen. I knew she was exaggerating, but it still made me more nervous." +
                    "</p>" + 
            
                     "<p class=\"tr__para slideInUp \">" +
                    "By the time the driver got out of his seat and opened the door for me, Sam had already left the car. When she joined my side, the driver bowed before us." +
                    "</p>" +              
            
            
                     "<p class=\"tr__para slideInUp \">" +
                    "“Welcome to the Nishimura residence,” he said in perfect English. “I’ll be your personal assistant for your stay. If there is anything you need, please let me know. If you’d like, please go inside while I bring your luggage to your rooms.” With that, he excused himself and got to work at the trunk." +
                    "</p>" + 
            
                     "<p class=\"tr__para slideInUp \">" +
                    "Sam and I stared at each other." +
                    "</p>" +        
            
                     "<p class=\"tr__para slideInUp \">" +
                    "“So much for ‘just the driver’,” I whispered with a twinge of panic." +
                    "</p>" + 
            
                     "<p class=\"tr__para slideInUp \">" +
                    "“Oops.”" +
                    "</p>" +              
            
            
            
                "<div class=\"tr__btnwrap slideInUp slideInUp4\">" +
                "<a class=\"squiffy-link link-section last\" data-section=\"thanks\" role=\"link\" tabindex=\"0\">To be continued</a>" +
                "</div>",
            'passages': {},
        },
        'thanks': {
            'text': "" +
                "<article id=\"slide02\" class=\"tr__slide tr__slide02 qt angled-both-right-left\">" +
                "<div class=\"tr__slide01__bcg\"></div>" +
                "<div class=\"tr__slide01__wrapper\">" +
                "<section>" +
                "<blockquote class=\"tr__quote thanks\">" +
                "<p class=\"tr__quote__para\">" +
                "Thank you for checking out the teaser. We hope you enjoyed it and we'll see you again when the final version gets released." +
                "</p>" +
                "<p class=\"tr__quote__para\">" +
                "We'd appreciate feedback, even if it's just to report a bug. Let us know what you think, which features you like or don't like. Maybe you also have some awesome ideas how to enhance the experience with “Family Matters”." +
                "</p>" +
                "<p class=\"tr__quote__para\">" +
                "Just use the <a href=\"https://ssendurance.github.io/#contact\" target=\"_blank\">JaffaBox</a> or contact us on <a href=\"http://burritorat.tumblr.com/\" target=\"_blank\">Tumblr</a> (burritorat) or <a href=\"https://twitter.com/deberzer\" target=\"_blank\">Twitter</a> (deberzer)." +
                "</p>" +
                "</blockquote>" +
               
               
                "</section>" +
                "</div>" +
                "</article>",
            'passages': {},
        },
    }
})();
