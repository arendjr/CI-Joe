define("jquery.validate", ["jquery.util", "lodash"], function($, _) {

    "use strict";

    var VALIDATORS = {
        "checked": _.identity,
        "color": "isValidColor",
        "email": "isValidEmail",
        "min-length": function(value, minLength) { return value.trim().length >= minLength; },
        "non-empty": function(value) { return value.trim().length > 0; },
        "url": "isValidUrl"
    };

    // converts a validator given as a string to a validator method
    // strings are the name of a validator in the VALIDATORS constant, with an optional
    // colon and single argument
    function getValidator(validator) {

        var argument;
        if (typeof validator === "string") {
            var index = validator.indexOf(":");
            if (index > -1) {
                argument = validator.slice(index + 1);
                validator = validator.slice(0, index);
            }
            if (_.has(VALIDATORS, validator)) {
                validator = VALIDATORS[validator];
                if (typeof validator === "string") {
                    validator = $[validator];
                }
            } else {
                throw new Error("Not a valid validator: " + validator);
            }
        }

        return function(value) {
            try {
                return validator(value, argument);
            } catch(exception) {
                console.log("Validator exception: " + exception);
                return false;
            }
        };
    }

    function addClass($el, className) {

        if ($el.is("textarea")) {
            var $container = $el.closest(".textarea-container");
            if ($container.length) {
                $el = $container;
            }
        }

        $el.addClass(className);
    }

    function removeClass($el, className) {

        if ($el.is("textarea")) {
            var $container = $el.closest(".textarea-container");
            if ($container.length) {
                $el = $container;
            }
        }

        $el.removeClass(className);
    }

    /**
     * Returns whether the given string is a HTML hex color.
     */
    $.isValidColor = function(color) {

        return (/^#[0-9a-fA-F]{6}$/).test(color);
    };

    /**
     * Returns whether the given string is a valid email address.
     */
    $.isValidEmail = function(email) {

        var atIndex = email.indexOf("@");
        var dotIndex = email.lastIndexOf(".");
        var spaceIndex = email.indexOf(" ");
        return (atIndex > 0 && dotIndex > atIndex + 1 &&
                dotIndex < email.length - 2 && spaceIndex === -1);
    };

   /**
    * Returns whether the given string is a valid url.
    */
    $.isValidUrl = function(url) {

        return (/((ftp|https?):\/\/|www)[^ "]+\.[a-zA-Z]{2,}(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?\/?$/.test(url));
    };

    /**
     * Returns whether the input of one or more elements is valid.
     *
     * If there is one element which is not a an input element or which has invalid input, this
     * method returns false. It is also invalid if there are no matched elements.
     *
     * You need to call validate() on the elements you wish to validate before you can call
     * isValid() (or it will always return false otherwise).
     */
    $.fn.isValid = function() {

        var valid = (this.length > 0);
        this.each2(function() {
            if (!$(this).data("valid")) {
                valid = false;
            }
        });
        return valid;
    };

    /**
     * Reveals whether the input of the element is valid by adding or removing the "error" class
     * as appropriate.
     *
     * By default, when the input is invalid, this is automatically revealed on blur, but if the
     * element never received focus to begin with, this method can be used to grab attention.
     *
     * You need to call validate() on the elements before you can call revealValidity() on them.
     */
    $.fn.revealValidity = function() {

        this.each2(function() {
            var $this = $(this);
            var valid = $this.data("valid");
            if (typeof valid === "boolean") {
                if (valid) {
                    removeClass($this, "error");
                } else {
                    addClass($this, "error");
                }
            }
        });

        return this;
    };

    /**
     * Attaches a validator to one or more input elements.
     *
     * The validator will set the "error" class on the element(s) if the input is not valid and
     * makes it possible to call isValid() on the element(s).
     *
     * @param validator Either the name of a predefined validator (see the VALIDATORS constant),
     *                  or a function with a boolean return value that validates its first argument.
     */
    $.fn.validate = function(validator) {

        validator = getValidator(validator);

        this.on("blur change keyup paste", function() {
            var $this = $(this);
            var value = ($this.attr("type") === "checkbox" ? $this.prop("checked") : $this.val());
            var valid = validator(value);
            $this.data("valid", valid);
            if (valid) {
                removeClass($this, "error");
            }
        });
        this.on("blur", function() {
            var $this = $(this);
            if (!$this.data("valid")) {
                addClass($this, "error");
            }
        });

        this.each2(function() {
            var $this = $(this);
            var value = ($this.attr("type") === "checkbox" ? $this.prop("checked") : $this.val());
            $this.data("valid", validator(value));
        });

        return this;
    };

    return $;

});
