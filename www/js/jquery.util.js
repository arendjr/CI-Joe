define("jquery.util",
       ["canvasloader", "jquery", "l10n", "lodash"],
       function(CanvasLoader, $, l10n, _) {

    "use strict";

    /**
     * Turns a string into its camel-case equivalant, removing dashes and underscores and converting
     * their follow-up characters to upper-case.
     */
    $.camelize = function(str) {

        return str.replace(/[\-_](\w)/g, function(match) {
            return match[1].toUpperCase();
        });
    };

    /**
     * Clips a string to a maximum length. If the string exceeds the length, it is truncated and
     * three dots are appended.
     */
    $.clip = function(string, maxLength) {

        if (string) {
            string = string.toString();
            if (string.length > maxLength) {
                string = string.substr(0, maxLength - 2) + "\u2026";
            }
            return string;
        } else {
            return "";
        }
    };

    /**
     * Opposite of $.param().
     */
    $.deparam = function(params) {

        var object = {};
        _.each(params.split("&"), function(pair) {
            var keyValue = pair.split("=");
            if (keyValue.length === 2) {
                var key = decodeURIComponent(keyValue[0]).replace(/\+/g, " ");
                var value = decodeURIComponent(keyValue[1]).replace(/\+/g, " ");
                object[key] = value;
            }
        });
        return object;
    };

    /**
     * Formats a date.
     *
     * @param date Date object to format.
     * @param format The format to use. The following sequences have special meaning:
     *               'd' - Numerical day of the month, without leading zero.
     *               'dd' - Numerical day of the month, with leading zero.
     *               'm' - Numerical month, without leading zero.
     *               'mm' - Numerical month, with leading zero.
     *               'w' - Short day of the week ("Wed", "Sat", ...)
     *               'y' - 2-digit year, without century.
     *               'yy' - 4-digit year, with century.
     */
    $.formatDate = function(date, format) {

        var i = 0, output = "";

        // check whether a format character is doubled
        function lookAhead(match) {
            var matches = (i + 1 < format.length && format.charAt(i + 1) === match);
            if (matches) {
                i++;
            }
            return matches;
        }

        // format a number, with leading zero if necessary
        function formatNumber(match, value, len) {
            var num = "" + value;
            if (lookAhead(match)) {
                while (num.length < len) {
                    num = "0" + num;
                }
            }
            return num;
        }

        for (; i < format.length; i++) {
            switch (format.charAt(i)) {
            case "d":
                output += formatNumber("d", date.getDate(), 2);
                break;
            case "m":
                output += formatNumber("m", date.getMonth() + 1, 2);
                break;
            case "w":
                output += l10n.SHORT_DAYS[date.getDay()];
                break;
            case "y":
                output += (lookAhead("y") ? date.getFullYear() :
                    (date.getYear() % 100 < 10 ? "0" : "") + date.getYear() % 100);
                break;
            default:
                output += format.charAt(i);
            }
        }
        return output;
    };

    /**
     * Formats a time.
     *
     * @param date Date object to format.
     * @param format The format to use. The following sequences have special meaning:
     *               'h' - Hours in 12-hour format, without leading zero.
     *               'hh' - Hours in 12-hour format, with leading zero.
     *               'H' - Hours in 24-hour format, without leading zero.
     *               'HH' - Hours in 24-hour format, with leading zero.
     *               'm' - Minutes, without leading zero.
     *               'mm' - Minutes, with leading zero.
     *               'a' - am/pm.
     *               'A' - AM/PM.
     *               '\' - Escapes the next character.
     */
    $.formatTime = function(date, format) {

        var i = 0, output = "", literal = false;

        // check whether a format character is doubled
        function lookAhead(match) {
            var matches = (i + 1 < format.length && format.charAt(i + 1) === match);
            if (matches) {
                i++;
            }
            return matches;
        }

        // format a number, with leading zero if necessary
        function formatNumber(match, value, len) {
            var num = "" + value;
            if (lookAhead(match)) {
                while (num.length < len) {
                    num = "0" + num;
                }
            }
            return num;
        }

        for (; i < format.length; i++) {
            if (literal) {
                output += format.charAt(i);
                literal = false;
            } else {
                switch (format.charAt(i)) {
                case "h":
                    output += formatNumber("h", (date.getHours() % 12) || 12, 2);
                    break;
                case "H":
                    output += formatNumber("H", date.getHours(), 2);
                    break;
                case "m":
                    output += formatNumber("m", date.getMinutes(), 2);
                    break;
                case "a":
                    output += (date.getHours() < 12 ? "am" : "pm");
                    break;
                case "A":
                    output += (date.getHours() < 12 ? "AM" : "PM");
                    break;
                case "\\":
                    literal = true;
                    break;
                default:
                    output += format.charAt(i);
                }
            }
        }
        return output;
    };

    /**
     * Returns whether the given element is an input element, like <input> or <textarea>.
     *
     * @param element A valid DOM element.
     */
    $.isInputElement = function(element) {

        var $el = $(element);
        return ($el.is("input") || $el.is("textarea"));
    };

    /**
     * Returns whether the given string is a valid email address.
     */
    $.isValidEmail = function(email) {

        var atIndex = email.indexOf("@");
        var dotIndex = email.lastIndexOf(".");
        return (atIndex > -1 && dotIndex > atIndex);
    };

    /**
     * Escapes a plain string so that it becomes a valid, escaped JavaScript string, including its
     * surrounding quotes.
     *
     * This method is also suitable for escaping attribute values in CSS selectors.
     *
     * Example: "Hoe is 't?" becomes "'Hoe is \'t?'".
     */
    $.jsEscape = function(s) {

        if (s) {
            return "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
        } else {
            return "''";
        }
    };

    /**
     * Parses a date string.
     *
     * @param format Optional date format, using the same syntax as $.formatDate(). If omitted,
     *               an ISO 8601 formatted date is expected.
     */
    $.parseDate = function(dateString, format) {

        var result;
        if (format) {
            result = $.parseFormattedDate(dateString, format);
        } else {
            result = new Date(dateString);
        }

        if (isNaN(result.getTime()) && dateString) {
            var year, month, day, hour, minute, second;

            var dateTime = dateString.split("T");
            if (dateTime.length === 2) {
                var date = dateTime[0];
                if (date.length === 10) {
                    year = parseInt(date.substr(0, 4), 10);
                    month = parseInt(date.substr(5, 2), 10) - 1;
                    day = parseInt(date.substr(8, 2), 10);
                }

                var time = dateTime[1].split("+")[0];
                if (time.slice(-1) === "Z") {
                    time = time.substr(0, time.length - 1);
                }
                if (time.length === 8 || time.length === 12) {
                    hour = parseInt(time.substr(0, 2), 10);
                    minute = parseInt(time.substr(3, 2), 10);
                    second = parseInt(time.substr(6, 2), 10);
                }
            }

            result = new Date(Date.UTC(year, month, day, hour, minute, second));
        }
        return result;
    };

    $.parseFormattedDate = function(dateString, format) {

        if (dateString.trim() === "") {
            return new Date(Date.UTC());
        }

        var re = /\/|\.|-|年|月|日/;
        var formatParts = format.split(re).slice(0, 3);
        var parsedParts = dateString.split(re).slice(0, 3);

        var firstChar = formatParts[0].substr(0, 1);
        if (firstChar === "y") {
            parsedParts = [parsedParts[0], parsedParts[1], parsedParts[2]];
        } else if (firstChar === "m") {
            parsedParts = [parsedParts[2], parsedParts[0], parsedParts[1]];
        } else if (firstChar === "d") {
            parsedParts = [parsedParts[2], parsedParts[1], parsedParts[0]];
        }

        var year = _.parseInt(parsedParts[0]);
        var month = _.parseInt(parsedParts[1]) - 1;
        var day = _.parseInt(parsedParts[2]);

        if (year < 37) {
            year = 2000 + year;
        } else if (year < 100) {
            year = 1900 + year;
        }

        return new Date(Date.UTC(year, month, day));
    };

    /**
     * Extension on _.escape() which accepts translatable strings as argument and allows for the
     * inclusion of bold tags.
     */
    $.richEscape = function(s) {

        s = _.escape(s.toString());
        return s.replace(/&lt;b&gt;/gm, "<b>").replace(/&lt;\/b&gt;/gm, "</b>");
    };

    /**
     * Returns a URL to a static resource.
     *
     * @param path Path to the resource, without leading slash.
     */
    $.staticUrl = function(path) {

        /* global Joe */
        return Joe.application.baseUrl + path;
    };

    /**
     * Makes a textarea element automatically grow with the amount of lines of text inside.
     */
    $.fn.autoGrow = function(maxNumLines) {

        var $el = this;

        function adjustHeight() {
            var lines = $el.val().split("\n");
            var numLines = lines.length;

            var contentWidth = $el.width();
            var props = ["font-family", "font-size", "font-weight"];
            var $span = $("<span>").css($el.css(props))
                                   .css("opacity", "0").appendTo(document.body);
            for (var i = 0; i < lines.length; i++) {
                $span.text(lines[i]);
                numLines += Math.floor($span.width() / contentWidth);
            }
            $span.remove();

            $el.css("height", "auto").attr("rows", Math.min(numLines, maxNumLines || 8));
        }

        this.on("keyup paste", adjustHeight);
        setTimeout(adjustHeight, 1);
    };

    /**
     * 4-10 times faster .each replacement
     * use it carefully, as it overrides jQuery context of element on each iteration
     */
    $.fn.each2 = function(c) {

        var j = $([0]), i = -1, l = this.length;
        while (++i < l &&
               (j.context = j[0] = this[i]) &&
               c.call(j[0], i, j) !== false) {} //"this"=DOM, i=index, j=jQuery object
        return this;
    };

    /**
     * Overrides the $.html() function to detach children of an element before overwriting its
     * contents. This helps preserve event listeners bound to the previous content (which may later
     * be reinserted).
     */
    var fnHtml = $.fn.html;
    $.fn.html = function() {

        if (arguments.length > 0) {
            this.children().detach();
            return fnHtml.apply(this, arguments);
        } else {
            return fnHtml.call(this);
        }
    };

    /**
     * Selects all text inside an input or textarea element.
     */
    $.fn.selectText = function() {

        var doc = document, element = this[0], range, selection;
        if (element instanceof HTMLTextAreaElement) {
            if (element.setSelectionRange) {
                element.setSelectionRange(0, element.value.length);
            }
        } else {
            if (window.getSelection) {
                selection = window.getSelection();
                range = doc.createRange();
                range.selectNodeContents(element);
                selection.removeAllRanges();
                selection.addRange(range);
            } else if (doc.body.createTextRange) {
                range = doc.body.createTextRange();
                range.moveToElementText(element);
                range.select();
            }
        }
    };

    /**
     * Toggles the enabled state of an input or button element.
     */
    $.fn.setEnabled = function(enabled) {

        if (enabled) {
            this.removeAttr("disabled").removeAttr("tabindex");
        } else {
            this.attr({ "disabled": "", "tabindex": -1 });
        }
    };

    /**
     * Sets the options on a select input.
     */
    $.fn.setOptions = function(optionsMap, options) {

        options = options || {};

        var optionsArray = _.map(optionsMap, function(label, key) {
            return { key: key, label: label };
        });

        if (options.sortLabels) {
            optionsArray = _.sortBy(optionsArray, "label");
        }

        if (options.defaultLabel) {
            optionsArray.unshift({ key: "", label: options.defaultLabel });
        }

        var html = _.map(optionsArray, function(option) {
            var selected = (option.key === options.value ? " selected" : "");
            return "<option value=\"" + _.escape(option.key) + "\"" + selected + ">" +
                   _.escape(option.label.toString()) +
                   "</option>";
        }).join("");

        this.html(html);
    };

    /**
     * Starts a loader icon inside the element.
     */
    $.fn.startLoader = function(options) {

        options = options || {};

        var cl = this.data("cl-loader");
        if (!cl) {
            cl = new CanvasLoader(this[0]);
            cl.setShape("roundRect");
            cl.setColor(options.color || "#000000");
            cl.setDensity(options.density || 10);
            cl.setDiameter(options.diameter || 30);
            cl.setSpeed(options.speed || 1);
            cl.show();

            this.data("cl-loader", cl);
        }

        return this;
    };

    /**
     * Stops a previously started loader icon inside the element.
     */
    $.fn.stopLoader = function() {

        var cl = this.data("cl-loader");
        if (cl) {
            cl.hide();
            this.empty().removeData("cl-loader");
        }

        return this;
    };

    return $;

});
