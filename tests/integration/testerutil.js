/* jshint node: true */
/* global $: false, Joe: false, patchRequire: false, require: true */

"use strict";


require = patchRequire(require);
var _ = require("./lodash");

var TEST_PORT = 18080;


function position(index) {

    index++; // convert to 1-based index

    var modulo10 = index % 10;
    var modulo100 = index % 100;
    if (modulo10 === 1 && modulo100 !== 11) {
        return index + "st";
    } else if (modulo10 === 2 && modulo100 !== 12) {
        return index + "nd";
    } else if (modulo10 === 3 && modulo100 !== 13) {
        return index + "rd";
    } else {
        return index + "th";
    }
}


function Tester(casper) {

    this.casper = casper;

    this.test = casper.test;

    var name, method;
    for (name in casper) {
        method = casper[name];
        if (method instanceof Function && !this[name]) {
            this[name] = _.bind(method, casper);
        }
    }

    for (name in casper.test) {
        method = casper.test[name];
        if (method instanceof Function && !this[name]) {
            this[name] = _.bind(method, casper.test);
        }
    }
}

Tester.prototype.assertElementAttribute = function(selector, name, value, message) {

    message = message || "Element with selector \"" + selector + "\" " +
                         "should have \"" + name + "\" attribute with value \"" + value + "\"";

    this.test.assertEvalEquals(function(selector, name) {
        return $(selector).attr(name);
    }, value, message, [selector, name]);
};

Tester.prototype.assertElementChecked = function(selector, checked, message) {

    checked = (typeof checked === "undefined" ? true : checked);
    message = message || "Element with selector \"" + selector + "\" " +
                         "should" + (checked ? "" : "n't") + " be checked";

    this.test.assertEvalEquals(function(selector) {
        return $(selector).prop("checked");
    }, checked, message, [selector]);
};

Tester.prototype.assertElementData = function(selector, name, value, message) {

    message = message || "Element with selector \"" + selector + "\" " +
                         "should have \"" + name + "\" data with value \"" + value + "\"";

    this.test.assertEvalEquals(function(selector, name) {
        return $(selector).data(name);
    }, value, message, [selector, name]);
};

Tester.prototype.assertElementInNthElementText = function(subselector, selector, index,
                                                          text, message) {

    message = message || "Element with selector \"" + subselector + "\" within " +
                         position(index) + " element with selector \"" + selector + "\" " +
                         "should have text \"" + text + "\"";

    this.test.assertEvalEquals(function(selector, index, subselector) {
        return $(selector).eq(index).find(subselector).first().text();
    }, text, message, [selector, index, subselector]);
};

Tester.prototype.assertElementText = function(selector, text, message) {

    message = message || "Element with selector \"" + selector + "\" " +
                         "should have text \"" + text + "\"";

    this.test.assertEvalEquals(function(selector) {
        return $(selector).text().trim();
    }, text, message, [selector]);
};

Tester.prototype.assertElementValue = function(selector, value, message) {

    message = message || "Element with selector \"" + selector + "\" " +
                         "should have value \"" + value + "\"";

    this.test.assertEvalEquals(function(selector) {
        return $(selector).val();
    }, value, message, [selector]);
};

Tester.prototype.assertNthElementText = function(selector, index, text, message) {

    message = message || position(index) + " element with selector \"" + selector + "\" " +
                         "should have text \"" + text + "\"";

    this.test.assertEvalEquals(function(selector, index) {
        return $(selector).eq(index).text();
    }, text, message, [selector, index]);
};

Tester.prototype.assertSelection = function(selector, selection, message) {

    message = message || "Element with selector \"" + selector + "\" " +
                         "should have selection " + JSON.stringify(selection);

    this.test.assertEvalEquals(function(selector) {
        var data = $(selector).select2("data");
        return (data instanceof Array ? _.pluck(data, "id") : data.id);
    }, selection, message, [selector]);
};

Tester.prototype.assertSignalCount = function(channel, count) {

    var message;
    if (count === 1) {
        message = "1 notification should've been signalled on channel '" + channel + "'";
    } else {
        message = count + " notifications should've been signalled on channel '" + channel + "'";
    }

    this.test.assertEvalEquals(function(channel) {
        return Joe.signalCounts[channel] || 0;
    }, count, message, [channel]);
};

Tester.prototype.select = function(selector, id, name) {

    this.evaluate(function(selector, id, name) {
        var $el = $(selector);
        $el.select2("open");
        $el.select2("data", { id: id, text: name }).trigger("change");
    }, selector, id, name);
};

Tester.prototype.selectMultiple = function(selector, array) {

    this.evaluate(function(selector, array) {
        var $el = $(selector);
        $el.select2("open");
        $el.select2("data", array).trigger("change");
    }, selector, array);
};

Tester.prototype.setLocalStorageItem = function(key, value) {

    this.evaluate(function(key, value) {
        $.localStorage(key, value);
    }, key, value);
};

Tester.prototype.setSessionStorageItem = function(key, value) {

    this.evaluate(function(key, value) {
        $.sessionStorage(key, value);
    }, key, value);
};

Tester.prototype.start = function(callback) {

    var url = "http://localhost:" + TEST_PORT + "/";
    console.log("Test URL: " + url.replace(":" + TEST_PORT, ":8080") + "build/");

    this.casper.start(url, function() {
        callback();
    });

    return url;
};

Tester.prototype.trackSignalCount = function() {

    this.evaluate(function() {
        Joe.signalCounts = {};

        var notificationBus = Joe.application.notificationBus;
        var signalFunc = notificationBus.signal;
        notificationBus.signal = function(channel) {
            Joe.signalCounts[channel] = Joe.signalCounts[channel] || 0;
            Joe.signalCounts[channel]++;
            signalFunc.apply(notificationBus, arguments);
        };
    });
};

Tester.prototype.type = function(selector, text) {

    this.evaluate(function(selector, text) {
        var $el = $(selector);
        $el.focus().val(text).keyup().blur();

        var event = document.createEvent("Event");
        event.initEvent("change", true, true);
        $el.each(function() {
            this.dispatchEvent(event);
        });
    }, selector, text);
};


function newTester(test) {

    return new Tester(test);
}

exports.newTester = newTester;
