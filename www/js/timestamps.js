define("timestamps", ["i18n", "jquery", "l10n", "lodash"], function(i18n, $, l10n, _) {

    "use strict";

    var boundElements = [];

    function processAll() {

        process($("[data-timestamp]"));
    }

    function process($elements) {

        $elements.each2(function() {
            var el = this;
            processEl(el);

            if (!_.contains(boundElements, el)) {
                el.addEventListener("DOMAttrModified", function(event) {
                    if (event.attrName === "data-timestamp") {
                        processEl(el);
                    }
                });
                el.addEventListener("DOMNodeRemovedFromDocument", function() {
                    boundElements = _.without(boundElements, el);
                });
                boundElements.push(el);
            }
        });
    }

    function processEl(el) {

        var text = "-";
        var timestamp = _.parseInt(el.getAttribute("data-timestamp"));
        if (timestamp) {
            var delta = (Date.now() - timestamp) / 1000;
            if (delta < 60) {
                text = i18n("Just now");
            } else if (delta < 60 * 60) {
                var minutes = Math.floor(delta / 60);
                text = i18n("%1 min.").arg(minutes);
            } else if (delta < 24 * 60 * 60) {
                var hours = Math.floor(delta / (60 * 60));
                text = i18n("1 hour", "%1 hours").arg(hours);
            } else if (delta < 7 * 24 * 60 * 60) {
                var days = Math.floor(delta / (24 * 60 * 60));
                text = i18n("1 day", "%1 days").arg(days);
            } else if (delta < 31 * 24 * 60 * 60) {
                var weeks = Math.floor(delta / (7 * 24 * 60 * 60));
                text = i18n("1 week", "%1 weeks").arg(weeks);
            } else if (delta < 365 * 24 * 60 * 60) {
                var months = Math.floor(delta / (31 * 24 * 60 * 60));
                text = i18n("1 month", "%1 months").arg(months);
            } else {
                var years = Math.floor(delta / (365 * 24 * 60 * 60));
                text = i18n("1 year", "%1 years").arg(years);
            }
            el.setAttribute("title", l10n.dateTime(timestamp));
        }
        el.textContent = text;
    }

    setInterval(processAll, 30 * 1000);

    return {
        process: process
    };
});
