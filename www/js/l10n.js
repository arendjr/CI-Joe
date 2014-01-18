define("l10n", ["i18n", "jquery", "lodash"], function(i18n, $, _) {

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
         * Returns a nicely formatted date indicator, adjusted to the local timezone.
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
         * The currently active date format, as used by the date() method.
         *
         * Don't set this property directly, instead it should be set by setLocale().
         */
        dateFormat: "mm/dd/yy",

        /**
         * Returns a nicely formatted date/time indicator, adjusted to the local timezone.
         *
         * @param date The date, specified as a JavaScript Date object or as a ISO 8601
         *             formatted string. If ommitted, the current date is used.
         */
        dateTime: function(date) {

            if (date instanceof Date) {
                // good! really proud of you, caller!
            } else if (typeof date === "string") {
                date = new Date(date);
            } else {
                date = new Date();
            }

            return $.formatDate(date, this.dateFormat) + " " + $.formatTime(date, this.timeFormat);
        },

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

            var dateFormat = "yy-mm-dd",
                timeFormat = "H:mm";

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
                timeFormat = "h:mm a";
                break;
            case "BE":
            case "DE":
                dateFormat = "d.m.yy";
                break;
            case "FR":
                dateFormat = "dd/mm/yy";
                timeFormat = "H\\hmm";
                break;
            case "GB":
                timeFormat = "h:mm A";
                break;
            case "IT":
                dateFormat = "dd/mm/yy";
                break;
            case "JP":
                dateFormat = "yy年m月d日 (w)";
                timeFormat = "H時m分";
                break;
            case "NL":
                dateFormat = "dd-mm-yy";
                break;
            case "US":
                dateFormat = "mm/dd/yy";
                timeFormat = "h:mm A";
                break;
            }

            this.dateFormat = dateFormat;
            this.timeFormat = timeFormat;
            this._initConstants();
        },

        /**
         * Returns a nicely formatted time indicator, adjusted to the local timezone.
         *
         * @param date The time, specified as a JavaScript Date object or as a ISO 8601
         *             formatted string. If ommitted, the current time is used.
         */
        time: function(date) {

            if (date instanceof Date) {
                // good! really proud of you, caller!
            } else if (typeof date === "string") {
                date = new Date(date);
            } else {
                date = new Date();
            }

            return $.formatTime(date, this.timeFormat);
        },

        /**
         * The currently active time format, as used by the time() method.
         *
         * Don't set this property directly, instead it should be set by setLocale().
         */
        timeFormat: "H:mm",

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

    l10n._initLocales();

    return l10n;

});
