define("l10n", ["i18n", "jquery", "underscore"], function(i18n, $, _) {

    "use strict";

    /**
     * Provides a collection of helper methods for localization (l10n) purposes.
     */
    var l10n = {

        DAYS: [],

        LOCALES: {},

        MONTHS: [],

        SHORT_DAYS: [],

        TRANSLATIONS: ["nl-NL"],

        /**
         * Returns a nicely formatted date/time indicator, adjusted to the local timezone.
         *
         * @param date The date, specified as a JavaScript Date object or as a ISO 8601
         *             formatted string. If ommitted, the current date is used.
         */
        date: function(date) {

            if (date instanceof Date) {
                // good! really proud of you, caller!
            } else if (typeof date === "string") {
                date = new Date(date);
            } else {
                date = new Date();
            }

            return $.formatDate(date, this.dateFormat);
        },

        /**
         * The currently active date format, as used by the jQuery datepicker.
         *
         * Don't set this property directly, instead it should be set by setLocale().
         */
        dateFormat: "mm/dd/yy",

        /**
         * Detect the proper locale to use, based on the browser's language settings.
         */
        detectLocale: function() {

            var locale = navigator.language || navigator.userLanguage || "";
            var language = locale.substr(0, 2).toLowerCase();
            var country = locale.substr(3).toUpperCase();

            switch (language) {
            case "en":
                switch (country) {
                case "AU":
                    return "en-AU";
                case "CA":
                    return "en-CA";
                case "GB":
                case "UK":
                    return "en-GB";
                default:
                    return "en-US";
                }
                break;
            case "nl":
                return (country === "BE" ? "nl-BE" : "nl-NL");
            default:
                return "en-US";
            }
        },

        /**
         * Loads the translation that best matches the given locale.
         *
         * @param locale The locale to load a translation for.
         * @param options Optional options object.
         *                - context: Context in which the returned promise is returned.
         * @return Promise that is fulfilled when the translation is loaded.
         */
        loadTranslation: function(locale, options) {

            options = options || {};

            // if the locale does not have its own translation, find the closest matching one
            var translations = this.TRANSLATIONS;
            if (translations.indexOf(locale) === -1) {
                var language = locale.substr(0, 2);
                _.each(translations, function(translation) {
                    if (translation.substr(0, 2) === language) {
                        locale = translation;
                    }
                });
                if (translations.indexOf(locale) === -1) {
                    locale = "en-US";
                }
            }

            var deferred = new $.Deferred();

            require(["translations/" + locale], function(translations) {
                i18n.setTranslations(translations);

                deferred.resolveWith(options.context);
            });

            return deferred.promise();
        },

        /**
         * The currently active locale.
         *
         * Don't set this property directly, instead use Application.setLocale().
         */
        locale: "i-default",

        /**
         * Sets the currently active locale, as well as other properties that are influenced by it.
         *
         * Don't call this method directly, instead use Application.setLocale().
         */
        setLocale: function(locale) {

            this.locale = locale;

            var dateFormat;

            var country = locale.substr(3);
            switch (country) {
            case "AR":
            case "CO":
            case "ES":
            case "MX":
            case "PE":
            case "VE":
                dateFormat = "d/m/yy";
                break;
            case "AU":
                dateFormat = "d.m.yy";
                break;
            case "BE":
            case "DE":
                dateFormat = "d.m.yy";
                break;
            case "FR":
            case "IT":
                dateFormat = "dd/mm/yy";
                break;
            case "JP":
                dateFormat = "yy年m月d日 (w)";
                break;
            case "NL":
                dateFormat = "dd-mm-yy";
                break;
            case "US":
                dateFormat = "mm/dd/yy";
                break;
            default:
                dateFormat = "yy-mm-dd";
            }

            this.dateFormat = dateFormat;
            this._initConstants();
        },

        /**
         * Returns a timestamp, adjusted to the local timezone and formatted relative to the current
         * time.
         *
         * @param date The timestamp, specified as a JavaScript Date object or as a ISO 8601
         *             formatted string. If ommitted, the current date is used.
         * @param options Optional options object. If the showTime property is set to false, the
         *                timestamp reflects the date only.
         */
        timestamp: function(date, options) {

            options = options || {};
            var showTime = (options.showTime !== false);

            var now = new Date();

            if (date instanceof Date) {
                // good! really proud of you, caller!
            } else if (typeof date === "string") {
                date = $.parseDate(date);
            } else {
                date = now;
            }

            function wrap(text, absolute) {
                if (absolute) {
                    return "<span class=\"timestamp\">" + text + "</span>";
                } else {
                    startTimestampUpdater();
                    return "<span class=\"timestamp js-timestamp\" " +
                                 "data-date=\"" + date.getTime() + "\" " +
                                 "data-options=\"" + _.escape(JSON.stringify(options)) + "\">" +
                           text +
                           "</span>";
                }
            }

            var MINUTE = 60;
            var HOUR = 60 * MINUTE;
            var DAY = 24 * HOUR;

            var year = date.getFullYear();
            var month = this.MONTHS[date.getMonth()];
            var weekDay = this.DAYS[date.getDay()];
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();

            var locale = this.locale;
            var language = locale.substr(0, 2);

            var timeText = "";
            var dateText = "";
            var longDateText = "";
            if (language === "en" && locale !== "en-CA") {
                var amPm = (hours >= 12 ? "PM" : "AM");
                if (locale === "en-AU") {
                    amPm = amPm.toLowerCase();
                }

                hours %= 12;
                if (hours === 0) {
                    hours = 12;
                }

                timeText = hours + ":" + (minutes < 10 ? "0" + minutes : minutes) + " " + amPm;
                dateText = month + " " + day;
                longDateText = dateText + ", " + year;
            } else if (language === "ja") {
                timeText = hours + "時" + minutes + "分";
                dateText = $.formatDate(date, this.dateFormat);
            } else {
                var timeSeparator = (locale === "fr-FR" ? "h" : ":");
                timeText = hours + timeSeparator + (minutes < 10 ? "0" + minutes : minutes);

                if (language === "es") {
                    dateText = day + " de " + month;
                    longDateText = dateText + " de " + year;
                } else {
                    var dateSeparator = (language === "de" ? ". " : " ");
                    dateText = day + dateSeparator + month;
                    longDateText = dateText + " " + year;
                }
            }

            var diff = (now.getTime() - date.getTime()) / 1000;
            if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()) {
                if (showTime) {
                    if (diff > HOUR) {
                        return wrap(i18n("%1 hour ago", "%1 hours ago")
                                    .arg(Math.floor(diff / HOUR)));
                    } else if (diff > MINUTE) {
                        var numMinutes = Math.round(diff / MINUTE);
                        return wrap(i18n("%1 minute ago", "%1 minutes ago").arg(numMinutes));
                    } else {
                        return wrap(i18n("Just now"));
                    }
                } else {
                    return wrap(timeText, true);
                }
            }

            if (language === "ja") {
                if (diff < 2 * DAY && date.getDay() === now.getDay() - 1) {
                    return wrap(i18n("Yesterday") + (showTime ? timeText : ""), true);
                } else {
                    return wrap(showTime ? dateText + " " + timeText : dateText, true);
                }
            } else if (diff > 6 * DAY || date.getDay() > now.getDay() - 1) {
                if (date.getFullYear() === now.getFullYear()) {
                    return wrap(showTime ? i18n("%1 at %2").arg(dateText, timeText) : dateText,
                                true);
                } else {
                    return wrap(longDateText, true);
                }
            } else if (date.getDay() === now.getDay() - 1) {
                return wrap(showTime ? i18n("Yesterday at %1").arg(timeText) : i18n("Yesterday"),
                            true);
            } else {
                return wrap(showTime ? i18n("%1 at %2").arg(weekDay, timeText) : weekDay, true);
            }
        },

        _initConstants: function() {

            this.DAYS = [
                i18n("Sunday"),
                i18n("Monday"),
                i18n("Tuesday"),
                i18n("Wednesday"),
                i18n("Thursday"),
                i18n("Friday"),
                i18n("Saturday")
            ];

            this._initLocales();

            this.MONTHS = [
                i18n("January"),
                i18n("February"),
                i18n("March"),
                i18n("April"),
                i18n("May"),
                i18n("June"),
                i18n("July"),
                i18n("August"),
                i18n("September"),
                i18n("October"),
                i18n("November"),
                i18n("December")
            ];

            this.SHORT_DAYS = [
                i18n("Sun"),
                i18n("Mon"),
                i18n("Tue"),
                i18n("Wed"),
                i18n("Thu"),
                i18n("Fri"),
                i18n("Sat")
            ];
        },

        _initLocales: function() {

            this.LOCALES = {
                "en-AU": i18n("English (Australia)"),
                "en-CA": i18n("English (Canada)"),
                "en-GB": i18n("English (UK)"),
                "en-US": i18n("English (US)"),
                "nl-BE": i18n("Dutch (Belgium)"),
                "nl-NL": i18n("Dutch (Netherlands)")
            };
        }

    };

    var timestampUpdateInterval = null;

    function updateTimestamps() {

        var $timestamps = $(".js-timestamp");
        if ($timestamps.length) {
            $timestamps.each2(function(i, $el) {
                $el.replaceWith(l10n.timestamp(new Date($el.data("date")), $el.data("options")));
            });
        } else {
            clearInterval(timestampUpdateInterval);
            timestampUpdateInterval = null;
        }
    }

    function startTimestampUpdater() {

        if (!timestampUpdateInterval) {
            timestampUpdateInterval = setInterval(updateTimestamps, 30000);
        }
    }

    l10n._initLocales();

    return l10n;

});
