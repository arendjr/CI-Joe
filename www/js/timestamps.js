define("timestamps", ["i18n", "jquery", "l10n"], function(i18n, $, l10n) {

    "use strict";

    function processAll() {

        process($("[data-timestamp]"));
    }

    function process($elements) {

        $elements.each2(function() {
            processEl(this);
        });
    }

    function processEl(el) {

        var text = "-";
        var timestamp = el.getAttribute("data-timestamp");
        if (timestamp) {
            var delta = (Date.now() - timestamp) / 1000;
            if (delta < 30) {
                text = i18n("Just now");
            } else if (delta < 60 * 60) {
                var minutes = Math.floor(delta / 60);
                text = i18n("%1 min.").arg(minutes);
            } else if (delta < 24 * 60 * 60) {
                var hours = Math.floor(delta / (60 * 60));
                text = i18n("%1 hours").arg(hours);
            } else if (delta < 7 * 24 * 60 * 60) {
                var days = Math.floor(delta / (24 * 60 * 60));
                text = i18n("%1 days").arg(days);
            } else if (delta < 31 * 24 * 60 * 60) {
                var weeks = Math.floor(delta / (7 * 24 * 60 * 60));
                text = i18n("%1 weeks").arg(weeks);
            } else if (delta < 365 * 24 * 60 * 60) {
                var months = Math.floor(delta / (31 * 24 * 60 * 60));
                text = i18n("%1 months").arg(months);
            } else {
                var years = Math.floor(delta / (365 * 24 * 60 * 60));
                text = i18n("%1 years").arg(years);
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
