define("handlebars.helpers",
       ["handlebars", "i18n", "jquery", "jquery.util", "l10n", "lodash"],
       function(Handlebars, i18n, $, $util, l10n, _) {

    "use strict";

    Handlebars.registerHelper("clip", $.clip);

    Handlebars.registerHelper("date", _.bind(l10n.date, l10n));

    Handlebars.registerHelper("i18n", function(key) {

        var text = i18n(key);
        if (arguments.length > 1) {
            if (arguments.length === 4 && typeof arguments[2] === "number") {
                text = i18n(key, arguments[1]).arg(arguments[2]);
            } else {
                text = text.arg.apply(text, Array.prototype.slice.call(arguments, 1, -1));
            }
        }
        return text.toString();
    });

    Handlebars.registerHelper("img", function(path) {

        return $.staticUrl("img/" + path);
    });

    Handlebars.registerHelper("timestamp", function(date, _options) {

        var options = {};
        if (typeof _options === "string") {
            _.each(_options.split(","), function(option) {
                var value = true;
                if (option.substr(0, 1) === "-") {
                    option = option.substr(1);
                    value = false;
                }
                options[option] = value;
            });
        }
        return l10n.timestamp(date, options);
    });

});
