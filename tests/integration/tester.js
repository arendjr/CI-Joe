/* jshint node: true */
/* global $: false, Joe: false */

"use strict";


var _ = require("./tests/integration/lodash");

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

Tester.prototype.addRecipient = function(selector, id, name) {

    this.evaluate(function(selector, id, name) {
        var $recipients = $(selector);
        var data = $recipients.select2("data");
        data.push({ id: id, text: name });

        $recipients.select2("open");
        $recipients.select2("data", data).trigger("change");
        $recipients.select2("close");
    }, selector, id, name);
};

Tester.prototype.assertElementAttribute = function(selector, name, value, message) {

    message = message || "Element with selector \"" + selector + "\" " +
                         "should have \"" + name + "\" attribute with value \"" + value + "\"";

    this.test.assertEvalEquals(function(selector, name) {
        return $(selector).attr(name);
    }, value, message, [selector, name]);
};

Tester.prototype.assertElementCount = function(selector, count, message) {

    if (!message) {
        if (count === 1) {
            message = "" + count + " element with selector \"" + selector + "\" is expected";
        } else {
            message = "" + count + " elements with selector \"" + selector + "\" are expected";
        }
    }

    this.test.assertEvalEquals(function(selector) {
        return $(selector).length;
    }, count, message, [selector]);
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

Tester.prototype.assertRecipient = function(selector, index, id, name) {

    var data = this.evaluate(function(selector, index) {
        return $(selector).select2("data")[index];
    }, selector, index);

    var message = "ID of " + position(index) + " recipient in Select2 input \"" + selector + "\" " +
                  "should be \"" + id + "\"";
    this.test.assertEquals(data.id, id, message);

    message = "Name of " + position(index) + " recipient in Select2 input \"" + selector + "\" " +
              "should be \"" + name + "\"";
    this.test.assertEquals(data.text, name, message);
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
        var $recipients = $(selector);
        $recipients.select2("open");
        $recipients.select2("data", { id: id, text: name }).trigger("change");
    }, selector, id, name);
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
    console.log("Test URL: " + url.replace(":" + TEST_PORT, ":8080"));

    this.casper.start(url, function() {
        this.evaluate(function() {
            sessionStorage.clear();
            localStorage.clear();
        });

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
        $el.focus().val(text);
        for (var i = 0; i < Math.max(1, text.length); i++) {
            $el.keyup();
        }
        $el.blur();

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
