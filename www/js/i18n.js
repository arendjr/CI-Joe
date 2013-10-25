define("i18n", ["lodash"], function(_) {

    "use strict";

    var translations = {};

    function simplifyWhitespace(string) {

        return string.replace(/\s+/g, " ");
    }

    function TranslatableText(strings) {

        this.strings = strings;
    }

    _.extend(TranslatableText.prototype, {

        /**
         * Replaces argument placeholders in the text with actual arguments. E.g. "%1" will be
         * replaced with the first argument to this method, "%2" with the second, etc..
         *
         * This method can be chained. So i18n("%1 %2!").arg("Hello").arg("World") is the same as
         * i18n("%1 %2!").arg("Hello", "World").
         */
        arg: function() {

            var result;
            if (this.strings.length > 1) {
                // choose string based on whether the first argument is singular or plural
                result = (parseInt(arguments[0], 10) === 1 ? this.strings[0] : this.strings[1]);
            } else {
                result = this.strings[0];
            }

            var argNum;
            for (var i = 0; i < 10 && (argNum === undefined || argNum < arguments.length); i++) {
                var substr = "%" + i;
                var index = result.indexOf(substr);
                if (index > -1) {
                    if (argNum === undefined) {
                        argNum = 0;
                    }

                    while (index > -1) {
                        var replacement = arguments[argNum];
                        result = result.replace(substr, replacement);
                        index = result.indexOf(substr, index + replacement.length);
                    }
                }

                if (argNum !== undefined) {
                    argNum++;
                }
            }

            this.strings = [result];
            return this;
        },

        /**
         * Returns the translatable text in the user's language.
         */
        toString: function() {

            return this.strings[0];
        }

    });

    /**
     * Returns a translatable text string.
     *
     * @param string1 The string which should be translated to the user's language.
     * @param string2 A second string which should be translated. This argument is optional and is
     *                only used when you call .arg() on the returned text with a numerical argument.
     *                In this case the first string will be selected if the first argument to .arg()
     *                is 1, and the second string otherwise. In other words, the string1 would be
     *                the singular version and string2 the plural version.
     */
    function i18n(string1, string2) {

        var strings = [simplifyWhitespace(string1)];
        if (typeof string2 === "string") {
            strings.push(simplifyWhitespace(string2));
        }

        for (var i = 0; i < strings.length; i++) {
            if (_.has(translations, strings[i])) {
                strings[i] = translations[strings[i]];
            }
        }

        return new TranslatableText(strings);
    }

    /**
     * Sets the translations to use.
     */
    i18n.setTranslations = function(_translations) {

        if (_translations) {
            translations = _translations;
        }
    };

    return i18n;
});
