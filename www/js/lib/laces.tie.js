(function(window, document, undefined) {

"use strict";

function init(Laces) {

// Laces Tie constructor.
//
// model - The Laces Model to which we want to tie the template. May be a Laces
//         Map too.
// template - The template object used for rendering. May be a compiled
//            Handlebars.js, Hogan.js or Underscore.js template, or a plain HTML
//            string.
// options - Optional options object.
function LacesTie(model, template, options) {

    options = options || {};
    var editEvent = options.editEvent || "dblclick";
    var saveEvent = options.saveEvent || "change";
    var saveOnEnter = (options.saveOnEnter !== false);
    var saveOnBlur = (options.saveOnBlur !== false);

    var bindings = [];

    function clearBindings() {

        for (var i = 0, length = bindings.length; i < length; i++) {
            var binding = bindings[i];
            binding.parent.unbind(binding);
        }
        bindings = [];
    }

    function reference(lacesProperty) {
        var inversed = false;
        if (lacesProperty.slice(0, 1) === "!") {
            inversed = true;
            lacesProperty = lacesProperty.slice(1);
        }

        var parts = lacesProperty.split(".");
        var part, value, parent;
        for (var i = 0, length = parts.length; i < length; i++) {
            parent = value || model;

            part = parts[i];
            var bracketOpen = part.indexOf("[");
            if (bracketOpen > -1 && part.indexOf("]") === part.length - 1) {
                var subscript = part.slice(bracketOpen + 1, -1);
                parent = parent[part.slice(0, bracketOpen)];
                part = subscript;
            }

            value = parent[part];
            if (value === undefined || value === null) {
                break;
            }
        }

        if (inversed) {
            value = !value;
        }
        return { propertyName: part, value: value, parent: parent };
    }

    function getLaces(node) {
        function splitObject(string) {
            console.log("splitting: " + string)
            var parts = string.split(",");
            var object = {};
            for (var i = 0, length = parts.length; i < length; i++) {
                var keyValue = parts[i].split(":");
                object[keyValue[0].trim()] = keyValue[1].trim();
            }
            return object;
        }

        var laces = node.getAttribute("data-laces");
        if (laces) {
            if (laces.slice(0, 1) === "{" && laces.slice(-1) === "}") {
                return splitObject(laces.slice(1, -1));
            } else if (laces.slice(0, 1) === "[" && laces.slice(-1) === "]") {
                laces = laces.slice(1, -1);
                var array = [];
                while (laces) {
                    var startIndex = laces.indexOf("{"),
                        endIndex = laces.indexOf("}"),
                        commaIndex = laces.indexOf(",");
                    if (startIndex > -1 && startIndex < commaIndex && startIndex < endIndex) {
                        array.push(splitObject(laces.slice(startIndex + 1, endIndex)));
                        laces = laces.slice(endIndex + 1);
                    } else if (commaIndex > 0) {
                        console.log("found  comma ")
                        array.push(splitObject(laces.slice(0, commaIndex)));
                        laces = laces.slice(commaIndex + 1);
                    } else {
                        array.push(splitObject(laces.slice(0)));
                        laces = "";
                    }
                }
                return array;
            }
        }
        return undefined;
    }

    function update(element, lacesProperty, defaultValue) {
        var value = reference(lacesProperty).value;
        if (element.tagName === "INPUT" || element.tagName === "SELECT") {
            if (element.getAttribute("type") === "checkbox") {
                element.checked = !!value;
            } else {
                element.value = value || defaultValue;
            }
        } else {
            element.textContent = value || defaultValue;
        }
    }

    function updateVisibility(element, lacesProperty) {
        var value = !!reference(lacesProperty).value;
        element.style.display = (value ? "" : "none");
    }

    function updateChecked(element, lacesProperty) {
        element.checked = !!reference(lacesProperty).value;
    }

    function updateClass(element, lacesProperty) {
        var originalAttr = "data-laces-original-class";
        var originalClass = element.getAttribute(originalAttr);
        if (!originalClass) {
            originalClass = element.getAttribute("class");
            element.setAttribute(originalAttr, originalClass);
        }
        var classes = originalClass + " " + reference(lacesProperty).value;
        element.setAttribute("class", classes);
    }

    function updateDisabled(element, lacesProperty) {
        element.disabled = !!reference(lacesProperty).value;
    }

    function makeEditable(node, lacesProperty) {
        node.addEventListener(editEvent, function() {
            var parent = node.parentNode;
            var input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("value", node.textContent);
            input.setAttribute("class", node.getAttribute("class"));

            function saveHandler() {
                input.removeEventListener(saveEvent, saveHandler);
                input.removeEventListener("keypress", keypressHandler);
                input.removeEventListener("blur", saveHandler);

                var newRef = reference(lacesProperty);
                newRef.parent[newRef.propertyName] = input.value;
                parent.insertBefore(node, input.nextSibling);
                parent.removeChild(input);
            }
            function keypressHandler(event) {
                if (event.keyCode === 13) {
                    saveHandler();
                    event.preventDefault();
                }
            }

            input.addEventListener(saveEvent, saveHandler);
            if (saveOnEnter) {
                input.addEventListener("keypress", keypressHandler);
            }
            if (saveOnBlur) {
                input.addEventListener("blur", saveHandler);
            }

            parent.insertBefore(input, node.nextSibling);
            parent.removeChild(node);
            input.focus();
        });
    }

    function tieProperty(laces, node) {
        var prop = laces.property;
        if (prop) {
            var lacesDefault = laces["default"];
            if (lacesDefault === undefined || lacesDefault === null) {
                lacesDefault = (node.getAttribute("type") === "number") ? 0 : "";
            }

            var binding = function() {
                update(node, prop, lacesDefault);
            };
            bindings.push(binding);

            var ref = reference(prop);
            binding.parent = ref.parent;
            if (ref.parent instanceof Laces.Model) {
                ref.parent.bind("change:" + ref.propertyName, binding);
            } else {
                ref.parent.bind("change", binding);
            }

            if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
                node.addEventListener(saveEvent, function() {
                    var newRef = reference(prop);
                    newRef.parent[newRef.propertyName] = (node.getAttribute("type") === "checkbox" ?
                                                          !!node.checked : node.value);
                });
            }

            update(node, prop, lacesDefault);

            if (laces.editable === "true") {
                makeEditable(node, prop);
            }
        }
    }

    function tieOtherProperty(laces, node, propertyName, updateMethod) {
        var prop = laces[propertyName];
        if (prop) {
            var binding = function() {
                updateMethod(node, prop);
            };
            bindings.push(binding);

            var ref = reference(prop);
            binding.parent = ref.parent;
            if (ref.parent instanceof Laces.Model) {
                ref.parent.bind("change:" + ref.propertyName, binding);
            } else {
                ref.parent.bind("change", binding);
            }

            updateMethod(node, prop);
        }
    }

    function process(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            var laces = getLaces(node), lace;
            if (!laces) {
                lace = {
                    "default": node.getAttribute("data-laces-default"),
                    editable: node.getAttribute("data-laces-editable"),
                    property: node.getAttribute("data-laces-property"),
                    target: node.getAttribute("data-laces-target")
                };
                if (!lace.target) {
                    var shortcuts = ["checked", "class", "disabled", "visible"];
                    for (var j = 0; j < shortcuts.length; j++) {
                        var attr = shortcuts[j], val = node.getAttribute("data-laces-" + attr);
                        if (val) {
                            lace.property = val;
                            lace.target = val;
                        }
                    }
                }
            }
            if (!(laces instanceof Array)) {
                laces = [laces];
            }

            for (var i = 0; i < laces.length; i++) {
                lace = laces[i];
                tieProperty(lace, node);
            }

            for (var i = 0, length = node.childNodes.length; i < length; i++) {
                process(node.childNodes[i]);
            }
        }
    }

    function parse(html) {
        var fragment = document.createDocumentFragment();
        var container = document.createElement(html.match(/^<tr[\s>]/) ? "tbody" : "div");
        container.innerHTML = html;
        while (container.firstChild) {
            var child = container.firstChild;
            process(child);
            fragment.appendChild(child);
        }
        return fragment;
    }

    if (template.render) {
        this.render = function() { clearBindings(); return parse(template.render(model)); };
    } else if (typeof template === "function") {
        this.render = function() { clearBindings(); return parse(template(model)); };
    } else if (typeof template === "string") {
        this.render = function() { clearBindings(); return parse(template); };
    } else {
        model.log("Unknown template type: " + template);
    }
}

Laces.Tie = LacesTie;

}

if (typeof define === "function" && define.amd) {
    define(function(require) {
        var Laces = require("laces");
        init(Laces);
        return Laces;
    });
} else {
    var Laces = { Model: window.LacesModel, Map: window.LacesMap, Array: window.LacesArray };
    init(Laces);
    window.LacesTie = Laces.Tie;
}

})(this, document);
