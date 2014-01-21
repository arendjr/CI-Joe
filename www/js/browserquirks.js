define("browserquirks", [], function() {

    "use strict";

    function isDOMAttrModifiedSupported() {

        var flag = false;
        function callback() {
            flag = true;
        }

        var p = document.createElement("p");
        p.addEventListener("DOMAttrModified", callback, false);
        p.setAttribute("id", "target");
        return flag;
    }

    if (!isDOMAttrModifiedSupported()) {
        Element.prototype._setAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, val) {
            var event = document.createEvent("MutationEvents");
            var prev = this.getAttribute(name);
            this._setAttribute(name, val);
            event.initMutationEvent("DOMAttrModified", true, true, null, prev, val, name, 2);
            this.dispatchEvent(event);
        };
    }

});
