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

    function reference(propertyRef) {
        var inversed = false;
        if (propertyRef.slice(0, 1) === "!") {
            inversed = true;
            propertyRef = propertyRef.slice(1);
        }

        var parts = propertyRef.split(".");
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

    function getTies(node) {
        var tie = node.getAttribute("data-tie");
        if (tie) {
            var parts = tie.split(",");
            var object = {};
            for (var i = 0, length = parts.length; i < length; i++) {
                var keyValue = parts[i].split(":");
                object[keyValue[0].trim()] = keyValue[1].trim();
            }
            return object;
        }
        return undefined;
    }

    function updateChecked(element, propertyRef) {
        element.checked = !!reference(propertyRef).value;
    }

    function updateClass(element, propertyRef) {
        var originalAttr = "data-tie-class";
        var originalClass = element.getAttribute(originalAttr);
        if (!originalClass) {
            originalClass = element.getAttribute("class");
            element.setAttribute(originalAttr, originalClass);
        }
        var classes = originalClass + " " + reference(propertyRef).value;
        element.setAttribute("class", classes);
    }

    function updateDisabled(element, propertyRef) {
        element.disabled = !!reference(propertyRef).value;
    }

    function updateText(element, propertyRef, defaultValue) {
        var value = reference(propertyRef).value;
        element.textContent = value || defaultValue;
    }

    function updateValue(element, propertyRef, defaultValue) {
        var value = reference(propertyRef).value;
        element.value = value || defaultValue;
    }

    function updateVisible(element, propertyRef) {
        var value = !!reference(propertyRef).value;
        element.style.display = (value ? "" : "none");
    }

    function makeEditable(node, propertyRef) {
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

                var newRef = reference(propertyRef);
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

    function updateMethodForKey(key) {
        switch(key) {
        case "checked": return updateChecked;
        case "class": return updateClass;
        case "disabled": return updateDisabled;
        case "text": return updateText;
        case "value": return updateValue;
        case "visible": return updateVisible;
        }
    }

    function tieProperties(tie, element) {
        var defaultValue = tie["default"];
        if (defaultValue === undefined || defaultValue === null) {
            defaultValue = (element.getAttribute("type") === "number") ? 0 : "";
        }

        for (var key in tie) {
            if (tie.hasOwnProperty(key)) {
                var propertyRef = tie[key];
                var updateMethod = updateMethodForKey(key);
                if (!updateMethod) {
                    continue;
                }

                var binding = function() {
                    updateMethod(element, propertyRef, defaultValue);
                };
                bindings.push(binding);

                var ref = reference(propertyRef);
                binding.parent = ref.parent;
                if (ref.parent instanceof Laces.Model) {
                    ref.parent.bind("change:" + ref.propertyName, binding);
                } else {
                    ref.parent.bind("change", binding);
                }

                if (key === "checked" || key === "value") {
                    element.addEventListener(saveEvent, function() {
                        var newRef = reference(propertyRef);
                        newRef.parent[newRef.propertyName] = (key === "checked" ?
                                                              !!element.checked : element.value);
                    });
                }

                updateMethod(element, propertyRef, defaultValue);

                if (key === "text" && tie.editable === "true") {
                    makeEditable(element, prop);
                }
            }
        }
    }

    function process(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            var ties = getTies(node);
            if (ties) {
                tieProperties(ties, node);
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
