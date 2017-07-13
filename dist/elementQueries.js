!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define("elementQueries",["resizeSensor"],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.elementQueries=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var elementQueries = (function (global) {
    'use strict';

    var resizeSensor = null;

    try {
        resizeSensor = ('resizeSensor' in global) ? global['resizeSensor'] : global.require('resizeSensor');
    } catch (e) {}

    if (resizeSensor === null) {
        var logMissingResizeDetectorError = function () {
            console && console.error("EQ's depend on a resize detector. Provide a detector and try again.");
        };

        return {
            initializeSingle: logMissingResizeDetectorError,
            initializeMultiple: logMissingResizeDetectorError,
            destroySingle: logMissingResizeDetectorError,
            destroyMultiple: logMissingResizeDetectorError
        }
    }

    /** @var {string} */
    var dataAttrName = 'data-element-queries';
    /** @var {object} */
    var registry = require('./registry');

    /**
     * @param {string} targetElementId
     */
    function initializeSingle (targetElementId) {
        var targetElement = global.document.querySelector(getCssSelector(targetElementId));

        if (!targetElement) {
            console && console.info('No valid element found for given selector. Exiting.', getCssSelector(targetElementId));
            return;
        }

        initializeElementQueries([targetElement]);
    }

    /**
     * @param {string} parentElementId
     */
    function initializeMultiple (parentElementId) {
        var targetElements = global.document.querySelectorAll(getCssSelector(parentElementId, true));

        if (targetElements.length === 0) {
            console && console.info('No valid elements found for given selector. Exiting.', getCssSelector(parentElementId, true));
            return;
        }

        initializeElementQueries(targetElements);
    }

    /**
     * @param {NodeList|[]} targetElements
     */
    function initializeElementQueries (targetElements) {
        var i;
        var elementCount = targetElements.length;

        for (i = 0; i < elementCount; i++) {
            var targetElement = targetElements[i];
            var elementId = targetElement.id;

            if (elementId && registry.get(elementId) !== null) {
                console && console.info('A `ElementQueryElement` for given elementId already exists. If you need to reset it, destroy existing one first.', elementId);
                continue;
            }

            var elementQueryElement = registry.add(targetElement);
            resizeSensor.create(targetElement, getResizeCallback(elementQueryElement));
            elementQueryElement.initialize();
        }
    }

    /**
     * @param {string} parentElementId
     */
    function destroyMultiple (parentElementId) {
        var targetElements = global.document.querySelectorAll(getCssSelector(parentElementId, true));
        var elementCount = targetElements.length;

        if (elementCount === 0) {
            console && console.info('No elements found for given selector. Exiting.', parentElementId, selector);
        }

        destroyElementQueries(targetElements);
    }

    /**
     * @param {string} targetElementId
     */
    function destroySingle (targetElementId) {
        var targetElement = global.document.querySelector(getCssSelector(targetElementId));

        if (!targetElement) {
            console && console.info('No valid element found for given selector. Exiting.');
            return;
        }

        destroyElementQueries([targetElement]);
    }

    /**
     * @param {NodeList|[]} targetElements
     */
    function destroyElementQueries (targetElements) {
        var i;
        var elementCount = targetElements.length;

        for (i = 0; i < elementCount; i++) {
            var targetElement = targetElements[i];

            var targetElementId = targetElement.id;
            var elementQueryElement = registry.get(targetElementId);

            if (!elementQueryElement) {
                console && console.info("Can't destroy `ElementQueryElement` (404 not found).", targetElement);
                continue;
            }

            registry.remove(elementQueryElement);
            elementQueryElement.destroy();
            resizeSensor.destroy(targetElement);
        }
    }

    /**
     * @param {elementQueryElement} elementQueryElement
     * @returns {Function}
     */
    function getResizeCallback (elementQueryElement) {
        return function (dimensions) {
            if (elementQueryElement.queryCount === 0) {
                return;
            }

            elementQueryElement.doQueries(dimensions);
        };
    }

    /**
     * @param {string} elementId
     * @param {boolean} [findChildren]
     * @returns {string}
     */
    function getCssSelector (elementId, findChildren) {
        if (findChildren) {
            return '#' + elementId + ' [' + dataAttrName + ']';
        }

        return '#' + elementId + '[' + dataAttrName + ']';
    }

    return {
        initializeSingle: initializeSingle,
        initializeMultiple: initializeMultiple,
        destroySingle: destroySingle,
        destroyMultiple: destroyMultiple
    }
})(typeof window !== 'undefined' ? window : this);

module.exports = elementQueries;
},{"./registry":4}],2:[function(require,module,exports){
var elementQueryElementFactory = (function () {
    'use strict';

    /** @var {Object} */
    var elementQueryFactory = require('./elementQueryFactory');

    /**
     * @param {Element} targetElement
     * @constructor
     */
    var elementQueryElement = function (targetElement) {
        /** @var {Element} */
        this.targetElement = targetElement;
        /** @var {ElementQuery[]} */
        this.allQueries = [];
        /** @var {int} */
        this.queryCount = 0;
        /** @var {boolean} */
        this.addClassNameAfterInit = false;
        /** @var {string} */
        this.classNameToAdd = '';
    };

    elementQueryElement.prototype.initialize = function () {
        /** @var {{queries: [], config: {classNameToToggleAfterInit: string}}} */
        var attributeData = this.getValueOfDataAttribute();

        if (!attributeData.queries || !('length' in attributeData['queries'])) {
            console && console.log('error', 'No element queries found. Exiting.');
            return;
        }

        if (attributeData.config) {
            this.setConfig(attributeData.config);
        }

        this.addElementQueries(attributeData.queries);
        this.doQueries({width: this.targetElement.offsetWidth, height: this.targetElement.offsetHeight});

        if (this.addClassNameAfterInit) {
            this.targetElement.className += ' ' + this.classNameToAdd;
        }
    };

    /**
     * @param {{classNameToToggleAfterInit: string}} config
     */
    elementQueryElement.prototype.setConfig = function (config) {
        if ('classNameToAddAfterInit' in config && config['classNameToAddAfterInit'] !== '') {
            this.addClassNameAfterInit = true;
            this.classNameToAdd = config['classNameToAddAfterInit'];
        }
    };

    /**
     * @param {[]} elementQueries
     */
    elementQueryElement.prototype.addElementQueries = function (elementQueries) {
        var j;
        var queryCount = elementQueries.length;

        for (j = 0; j < queryCount; j++) {
            var elementQuery = elementQueries[j];
            var queryProperties = getElementQueryProperties(elementQuery);

            if (!queryProperties) {
                console && console.error('Skipped element query as the query seems to be malformed.', elementQuery);
                continue;
            }

            var ElementQuery = elementQueryFactory.create(queryProperties.mode, queryProperties.property, queryProperties.value);
            this.allQueries.push(ElementQuery);
            this.queryCount++;
        }
    };

    /**
     * @param {{width: int, height: int}} dimensions
     */
    elementQueryElement.prototype.doQueries = function (dimensions) {
        var attributeValues = this.getAttributeValues(dimensions);
        this.writeAttributes(attributeValues);
    };

    /**
     * @param {{width: int, height: int}} dimensions
     * @returns {{}}
     */
    elementQueryElement.prototype.getAttributeValues = function (dimensions) {
        var attributeValues = {};
        var i;

        for (i = 0; i < this.queryCount; i++) {
            /** @var {ElementQuery} */
            var ElementQuery = this.allQueries[i];

            if (!ElementQuery.isMatchFor(dimensions)) {
                continue;
            }

            var attrName = ElementQuery.getAttributeName();
            var attrValue = ElementQuery.getPxValue();

            if (!attributeValues[attrName]) {
                attributeValues[attrName] = attrValue;
            } else if (attributeValues[attrName].indexOf(attrValue) === -1) {
                attributeValues[attrName] += ' ' + attrValue;
            }
        }

        return attributeValues;
    };

    /**
     * @param {{}} attributeValues
     */
    elementQueryElement.prototype.writeAttributes = function (attributeValues) {
        var allAttributes = ['min-width', 'min-height', 'max-width', 'max-height'];
        var i;
        var l = allAttributes.length;

        for (i = 0; i < l; i++) {
            if (attributeValues[allAttributes[i]]) {
                this.targetElement.setAttribute(allAttributes[i], attributeValues[allAttributes[i]]);
                continue;
            }

            this.targetElement.removeAttribute(allAttributes[i]);
        }
    };

    elementQueryElement.prototype.destroy = function () {
        delete this.targetElement;
        delete this.allQueries;
        delete this.queryCount;
    };

    /**
     * @return {null|{queries: [], config: {classNameToToggleAfterInit: string}}}
     */
    elementQueryElement.prototype.getValueOfDataAttribute = function () {
        var queryData = JSON.parse(this.targetElement.getAttribute('data-element-queries'));

        if (!queryData) {
            console && console.error('No configuration found for given element. Config is passed via the `data-element-queries` attribute. Exiting.', this.targetElement);
            return null;
        }

        return queryData;
    };

    /**
     * @returns {string}
     */
    elementQueryElement.prototype.getId = function () {
        return this.targetElement.id;
    };

    /**
     * @param {string} elementQuery
     * @returns {{mode: string, property: string, value: string}}
     */
    function getElementQueryProperties(elementQuery) {
        var regex = /(min|max)-(width|height)\s*:\s*(\d+px)/mgi;
        var match = regex.exec(elementQuery);

        if (!match) {
            return false;
        }

        return {
            mode: match[1],
            property: match[2],
            value: match[3].toLowerCase()
        };
    }

    return {
        /**
         * @param {Element} targetElement
         * @returns {elementQueryElement}
         */
        create: function (targetElement) {
            return new elementQueryElement(targetElement);
        }
    }
})();

module.exports = elementQueryElementFactory;

},{"./elementQueryFactory":3}],3:[function(require,module,exports){
var elementQueryFactory = (function () {
    'use strict';

    /**
     * @param {string} mode
     * @param {string} property
     * @param {string} value
     * @constructor
     */
    var elementQuery = function (mode, property, value) {
        if (mode !== 'min' && mode !== 'max') {
            throw new Error('Invalid mode (should be either `min` or `max`. Exiting.');
        }

        if (property !== 'width' && property !== 'height') {
            throw new Error('Invalid property (should be either `width` or `height`). Exiting.');
        }

        if (isNaN(parseFloat(value))) {
            throw new Error('Invalid value (should be numeric). Exiting.');
        }

        /** @var {string} */
        this.mode = mode;
        /** @var {string} */
        this.property = property;
        /** @var {number} */
        this.value = parseFloat(value);
        /** @var {string} */
        this.pxValue = value;
    };

    /**
     * @returns {string}
     */
    elementQuery.prototype.getMode = function () {
        return this.mode;
    };

    /**
     * @returns {string}
     */
    elementQuery.prototype.getProperty = function () {
        return this.property;
    };

    /**
     * @returns {number}
     */
    elementQuery.prototype.getValue = function () {
        return this.value;
    };

    /**
     * @returns {string}
     */
    elementQuery.prototype.getPxValue = function () {
        return this.pxValue;
    };

    /**
     * @param {{width: number, height: number}} dimensions
     * @returns {boolean}
     */
    elementQuery.prototype.isMatchFor = function (dimensions) {
        if (this.mode === 'min' && dimensions[this.property] >= this.value) {
            return true;
        }

        if (this.mode === 'max' && dimensions[this.property] <= this.value) {
            return true;
        }

        return false;
    };

    /**
     * @returns {string}
     */
    elementQuery.prototype.getAttributeName = function () {
        return this.mode + '-' + this.property;
    };

    return {
        /**
         * @param {string} mode
         * @param {string} property
         * @param {string} value
         * @returns {elementQuery}
         */
        create: function (mode, property, value) {
            return new elementQuery(mode, property, value);
        }
    };
})();

module.exports = elementQueryFactory;

},{}],4:[function(require,module,exports){
var registry = (function () {
    'use strict';

    /** @var {string} */
    var idPrefix = 'element-query-element-';
    /** @var {{elementId: elementQueryElement}} */
    var allElementQueryElements = {};
    /** @var int */
    var uniqueIdSuffix = 0;
    /** @var {object} */
    var elementQueryElementFactory = require('./elementQueryElementFactory');

    /**
     * @param {HTMLElement} targetElement
     */
    function identifyElement (targetElement) {
        var elementId = targetElement.id;

        if (elementId) {
            return;
        }

        elementId = idPrefix + (++uniqueIdSuffix);
        targetElement.id = elementId;
    }

    /**
     * @param {string} elementId
     * @returns {elementQueryElement}
     */
    function get (elementId) {
        if (!allElementQueryElements[elementId]) {
            return null;
        }

        return allElementQueryElements[elementId];
    }

    /**
     * @param {Element} targetElement
     * @returns {elementQueryElement}
     */
    function add (targetElement) {
        if (get(targetElement.id) !== null) {
            return;
        }

        identifyElement(targetElement);

        var elementQueryElement = elementQueryElementFactory.create(targetElement);
        allElementQueryElements[elementQueryElement.getId()] = elementQueryElement;

        return elementQueryElement;
    }

    /**
     * @param {elementQueryElement} elementQueryElement
     */
    function remove (elementQueryElement) {
        delete allElementQueryElements[elementQueryElement.getId()];
    }

    return {
        get: get,
        add: add,
        remove: remove
    };
})();

module.exports = registry;

},{"./elementQueryElementFactory":2}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZWxlbWVudFF1ZXJpZXMuanMiLCJzcmMvZWxlbWVudFF1ZXJ5RWxlbWVudEZhY3RvcnkuanMiLCJzcmMvZWxlbWVudFF1ZXJ5RmFjdG9yeS5qcyIsInNyYy9yZWdpc3RyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGVsZW1lbnRRdWVyaWVzID0gKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcmVzaXplU2Vuc29yID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICAgIHJlc2l6ZVNlbnNvciA9ICgncmVzaXplU2Vuc29yJyBpbiBnbG9iYWwpID8gZ2xvYmFsWydyZXNpemVTZW5zb3InXSA6IGdsb2JhbC5yZXF1aXJlKCdyZXNpemVTZW5zb3InKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgaWYgKHJlc2l6ZVNlbnNvciA9PT0gbnVsbCkge1xuICAgICAgICB2YXIgbG9nTWlzc2luZ1Jlc2l6ZURldGVjdG9yRXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IoXCJFUSdzIGRlcGVuZCBvbiBhIHJlc2l6ZSBkZXRlY3Rvci4gUHJvdmlkZSBhIGRldGVjdG9yIGFuZCB0cnkgYWdhaW4uXCIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0aWFsaXplU2luZ2xlOiBsb2dNaXNzaW5nUmVzaXplRGV0ZWN0b3JFcnJvcixcbiAgICAgICAgICAgIGluaXRpYWxpemVNdWx0aXBsZTogbG9nTWlzc2luZ1Jlc2l6ZURldGVjdG9yRXJyb3IsXG4gICAgICAgICAgICBkZXN0cm95U2luZ2xlOiBsb2dNaXNzaW5nUmVzaXplRGV0ZWN0b3JFcnJvcixcbiAgICAgICAgICAgIGRlc3Ryb3lNdWx0aXBsZTogbG9nTWlzc2luZ1Jlc2l6ZURldGVjdG9yRXJyb3JcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBAdmFyIHtzdHJpbmd9ICovXG4gICAgdmFyIGRhdGFBdHRyTmFtZSA9ICdkYXRhLWVsZW1lbnQtcXVlcmllcyc7XG4gICAgLyoqIEB2YXIge29iamVjdH0gKi9cbiAgICB2YXIgcmVnaXN0cnkgPSByZXF1aXJlKCcuL3JlZ2lzdHJ5Jyk7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0RWxlbWVudElkXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5pdGlhbGl6ZVNpbmdsZSAodGFyZ2V0RWxlbWVudElkKSB7XG4gICAgICAgIHZhciB0YXJnZXRFbGVtZW50ID0gZ2xvYmFsLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZ2V0Q3NzU2VsZWN0b3IodGFyZ2V0RWxlbWVudElkKSk7XG5cbiAgICAgICAgaWYgKCF0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlICYmIGNvbnNvbGUuaW5mbygnTm8gdmFsaWQgZWxlbWVudCBmb3VuZCBmb3IgZ2l2ZW4gc2VsZWN0b3IuIEV4aXRpbmcuJywgZ2V0Q3NzU2VsZWN0b3IodGFyZ2V0RWxlbWVudElkKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbml0aWFsaXplRWxlbWVudFF1ZXJpZXMoW3RhcmdldEVsZW1lbnRdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50RWxlbWVudElkXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5pdGlhbGl6ZU11bHRpcGxlIChwYXJlbnRFbGVtZW50SWQpIHtcbiAgICAgICAgdmFyIHRhcmdldEVsZW1lbnRzID0gZ2xvYmFsLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZ2V0Q3NzU2VsZWN0b3IocGFyZW50RWxlbWVudElkLCB0cnVlKSk7XG5cbiAgICAgICAgaWYgKHRhcmdldEVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZSAmJiBjb25zb2xlLmluZm8oJ05vIHZhbGlkIGVsZW1lbnRzIGZvdW5kIGZvciBnaXZlbiBzZWxlY3Rvci4gRXhpdGluZy4nLCBnZXRDc3NTZWxlY3RvcihwYXJlbnRFbGVtZW50SWQsIHRydWUpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGluaXRpYWxpemVFbGVtZW50UXVlcmllcyh0YXJnZXRFbGVtZW50cyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtOb2RlTGlzdHxbXX0gdGFyZ2V0RWxlbWVudHNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbml0aWFsaXplRWxlbWVudFF1ZXJpZXMgKHRhcmdldEVsZW1lbnRzKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIgZWxlbWVudENvdW50ID0gdGFyZ2V0RWxlbWVudHMubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBlbGVtZW50Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50c1tpXTtcbiAgICAgICAgICAgIHZhciBlbGVtZW50SWQgPSB0YXJnZXRFbGVtZW50LmlkO1xuXG4gICAgICAgICAgICBpZiAoZWxlbWVudElkICYmIHJlZ2lzdHJ5LmdldChlbGVtZW50SWQpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZSAmJiBjb25zb2xlLmluZm8oJ0EgYEVsZW1lbnRRdWVyeUVsZW1lbnRgIGZvciBnaXZlbiBlbGVtZW50SWQgYWxyZWFkeSBleGlzdHMuIElmIHlvdSBuZWVkIHRvIHJlc2V0IGl0LCBkZXN0cm95IGV4aXN0aW5nIG9uZSBmaXJzdC4nLCBlbGVtZW50SWQpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZWxlbWVudFF1ZXJ5RWxlbWVudCA9IHJlZ2lzdHJ5LmFkZCh0YXJnZXRFbGVtZW50KTtcbiAgICAgICAgICAgIHJlc2l6ZVNlbnNvci5jcmVhdGUodGFyZ2V0RWxlbWVudCwgZ2V0UmVzaXplQ2FsbGJhY2soZWxlbWVudFF1ZXJ5RWxlbWVudCkpO1xuICAgICAgICAgICAgZWxlbWVudFF1ZXJ5RWxlbWVudC5pbml0aWFsaXplKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50RWxlbWVudElkXG4gICAgICovXG4gICAgZnVuY3Rpb24gZGVzdHJveU11bHRpcGxlIChwYXJlbnRFbGVtZW50SWQpIHtcbiAgICAgICAgdmFyIHRhcmdldEVsZW1lbnRzID0gZ2xvYmFsLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZ2V0Q3NzU2VsZWN0b3IocGFyZW50RWxlbWVudElkLCB0cnVlKSk7XG4gICAgICAgIHZhciBlbGVtZW50Q291bnQgPSB0YXJnZXRFbGVtZW50cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGVsZW1lbnRDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZSAmJiBjb25zb2xlLmluZm8oJ05vIGVsZW1lbnRzIGZvdW5kIGZvciBnaXZlbiBzZWxlY3Rvci4gRXhpdGluZy4nLCBwYXJlbnRFbGVtZW50SWQsIHNlbGVjdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlc3Ryb3lFbGVtZW50UXVlcmllcyh0YXJnZXRFbGVtZW50cyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldEVsZW1lbnRJZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRlc3Ryb3lTaW5nbGUgKHRhcmdldEVsZW1lbnRJZCkge1xuICAgICAgICB2YXIgdGFyZ2V0RWxlbWVudCA9IGdsb2JhbC5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKGdldENzc1NlbGVjdG9yKHRhcmdldEVsZW1lbnRJZCkpO1xuXG4gICAgICAgIGlmICghdGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc29sZSAmJiBjb25zb2xlLmluZm8oJ05vIHZhbGlkIGVsZW1lbnQgZm91bmQgZm9yIGdpdmVuIHNlbGVjdG9yLiBFeGl0aW5nLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVzdHJveUVsZW1lbnRRdWVyaWVzKFt0YXJnZXRFbGVtZW50XSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtOb2RlTGlzdHxbXX0gdGFyZ2V0RWxlbWVudHNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkZXN0cm95RWxlbWVudFF1ZXJpZXMgKHRhcmdldEVsZW1lbnRzKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIgZWxlbWVudENvdW50ID0gdGFyZ2V0RWxlbWVudHMubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBlbGVtZW50Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50c1tpXTtcblxuICAgICAgICAgICAgdmFyIHRhcmdldEVsZW1lbnRJZCA9IHRhcmdldEVsZW1lbnQuaWQ7XG4gICAgICAgICAgICB2YXIgZWxlbWVudFF1ZXJ5RWxlbWVudCA9IHJlZ2lzdHJ5LmdldCh0YXJnZXRFbGVtZW50SWQpO1xuXG4gICAgICAgICAgICBpZiAoIWVsZW1lbnRRdWVyeUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlICYmIGNvbnNvbGUuaW5mbyhcIkNhbid0IGRlc3Ryb3kgYEVsZW1lbnRRdWVyeUVsZW1lbnRgICg0MDQgbm90IGZvdW5kKS5cIiwgdGFyZ2V0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlZ2lzdHJ5LnJlbW92ZShlbGVtZW50UXVlcnlFbGVtZW50KTtcbiAgICAgICAgICAgIGVsZW1lbnRRdWVyeUVsZW1lbnQuZGVzdHJveSgpO1xuICAgICAgICAgICAgcmVzaXplU2Vuc29yLmRlc3Ryb3kodGFyZ2V0RWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2VsZW1lbnRRdWVyeUVsZW1lbnR9IGVsZW1lbnRRdWVyeUVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0UmVzaXplQ2FsbGJhY2sgKGVsZW1lbnRRdWVyeUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudFF1ZXJ5RWxlbWVudC5xdWVyeUNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50UXVlcnlFbGVtZW50LmRvUXVlcmllcyhkaW1lbnNpb25zKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZWxlbWVudElkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZmluZENoaWxkcmVuXVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0Q3NzU2VsZWN0b3IgKGVsZW1lbnRJZCwgZmluZENoaWxkcmVuKSB7XG4gICAgICAgIGlmIChmaW5kQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybiAnIycgKyBlbGVtZW50SWQgKyAnIFsnICsgZGF0YUF0dHJOYW1lICsgJ10nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcjJyArIGVsZW1lbnRJZCArICdbJyArIGRhdGFBdHRyTmFtZSArICddJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0aWFsaXplU2luZ2xlOiBpbml0aWFsaXplU2luZ2xlLFxuICAgICAgICBpbml0aWFsaXplTXVsdGlwbGU6IGluaXRpYWxpemVNdWx0aXBsZSxcbiAgICAgICAgZGVzdHJveVNpbmdsZTogZGVzdHJveVNpbmdsZSxcbiAgICAgICAgZGVzdHJveU11bHRpcGxlOiBkZXN0cm95TXVsdGlwbGVcbiAgICB9XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHRoaXMpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVsZW1lbnRRdWVyaWVzOyIsInZhciBlbGVtZW50UXVlcnlFbGVtZW50RmFjdG9yeSA9IChmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqIEB2YXIge09iamVjdH0gKi9cbiAgICB2YXIgZWxlbWVudFF1ZXJ5RmFjdG9yeSA9IHJlcXVpcmUoJy4vZWxlbWVudFF1ZXJ5RmFjdG9yeScpO1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRFbGVtZW50XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgdmFyIGVsZW1lbnRRdWVyeUVsZW1lbnQgPSBmdW5jdGlvbiAodGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAvKiogQHZhciB7RWxlbWVudH0gKi9cbiAgICAgICAgdGhpcy50YXJnZXRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcbiAgICAgICAgLyoqIEB2YXIge0VsZW1lbnRRdWVyeVtdfSAqL1xuICAgICAgICB0aGlzLmFsbFF1ZXJpZXMgPSBbXTtcbiAgICAgICAgLyoqIEB2YXIge2ludH0gKi9cbiAgICAgICAgdGhpcy5xdWVyeUNvdW50ID0gMDtcbiAgICAgICAgLyoqIEB2YXIge2Jvb2xlYW59ICovXG4gICAgICAgIHRoaXMuYWRkQ2xhc3NOYW1lQWZ0ZXJJbml0ID0gZmFsc2U7XG4gICAgICAgIC8qKiBAdmFyIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuY2xhc3NOYW1lVG9BZGQgPSAnJztcbiAgICB9O1xuXG4gICAgZWxlbWVudFF1ZXJ5RWxlbWVudC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqIEB2YXIge3txdWVyaWVzOiBbXSwgY29uZmlnOiB7Y2xhc3NOYW1lVG9Ub2dnbGVBZnRlckluaXQ6IHN0cmluZ319fSAqL1xuICAgICAgICB2YXIgYXR0cmlidXRlRGF0YSA9IHRoaXMuZ2V0VmFsdWVPZkRhdGFBdHRyaWJ1dGUoKTtcblxuICAgICAgICBpZiAoIWF0dHJpYnV0ZURhdGEucXVlcmllcyB8fCAhKCdsZW5ndGgnIGluIGF0dHJpYnV0ZURhdGFbJ3F1ZXJpZXMnXSkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUgJiYgY29uc29sZS5sb2coJ2Vycm9yJywgJ05vIGVsZW1lbnQgcXVlcmllcyBmb3VuZC4gRXhpdGluZy4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhdHRyaWJ1dGVEYXRhLmNvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5zZXRDb25maWcoYXR0cmlidXRlRGF0YS5jb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hZGRFbGVtZW50UXVlcmllcyhhdHRyaWJ1dGVEYXRhLnF1ZXJpZXMpO1xuICAgICAgICB0aGlzLmRvUXVlcmllcyh7d2lkdGg6IHRoaXMudGFyZ2V0RWxlbWVudC5vZmZzZXRXaWR0aCwgaGVpZ2h0OiB0aGlzLnRhcmdldEVsZW1lbnQub2Zmc2V0SGVpZ2h0fSk7XG5cbiAgICAgICAgaWYgKHRoaXMuYWRkQ2xhc3NOYW1lQWZ0ZXJJbml0KSB7XG4gICAgICAgICAgICB0aGlzLnRhcmdldEVsZW1lbnQuY2xhc3NOYW1lICs9ICcgJyArIHRoaXMuY2xhc3NOYW1lVG9BZGQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHt7Y2xhc3NOYW1lVG9Ub2dnbGVBZnRlckluaXQ6IHN0cmluZ319IGNvbmZpZ1xuICAgICAqL1xuICAgIGVsZW1lbnRRdWVyeUVsZW1lbnQucHJvdG90eXBlLnNldENvbmZpZyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgaWYgKCdjbGFzc05hbWVUb0FkZEFmdGVySW5pdCcgaW4gY29uZmlnICYmIGNvbmZpZ1snY2xhc3NOYW1lVG9BZGRBZnRlckluaXQnXSAhPT0gJycpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3NOYW1lQWZ0ZXJJbml0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lVG9BZGQgPSBjb25maWdbJ2NsYXNzTmFtZVRvQWRkQWZ0ZXJJbml0J107XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtbXX0gZWxlbWVudFF1ZXJpZXNcbiAgICAgKi9cbiAgICBlbGVtZW50UXVlcnlFbGVtZW50LnByb3RvdHlwZS5hZGRFbGVtZW50UXVlcmllcyA9IGZ1bmN0aW9uIChlbGVtZW50UXVlcmllcykge1xuICAgICAgICB2YXIgajtcbiAgICAgICAgdmFyIHF1ZXJ5Q291bnQgPSBlbGVtZW50UXVlcmllcy5sZW5ndGg7XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHF1ZXJ5Q291bnQ7IGorKykge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnRRdWVyeSA9IGVsZW1lbnRRdWVyaWVzW2pdO1xuICAgICAgICAgICAgdmFyIHF1ZXJ5UHJvcGVydGllcyA9IGdldEVsZW1lbnRRdWVyeVByb3BlcnRpZXMoZWxlbWVudFF1ZXJ5KTtcblxuICAgICAgICAgICAgaWYgKCFxdWVyeVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IoJ1NraXBwZWQgZWxlbWVudCBxdWVyeSBhcyB0aGUgcXVlcnkgc2VlbXMgdG8gYmUgbWFsZm9ybWVkLicsIGVsZW1lbnRRdWVyeSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBFbGVtZW50UXVlcnkgPSBlbGVtZW50UXVlcnlGYWN0b3J5LmNyZWF0ZShxdWVyeVByb3BlcnRpZXMubW9kZSwgcXVlcnlQcm9wZXJ0aWVzLnByb3BlcnR5LCBxdWVyeVByb3BlcnRpZXMudmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5hbGxRdWVyaWVzLnB1c2goRWxlbWVudFF1ZXJ5KTtcbiAgICAgICAgICAgIHRoaXMucXVlcnlDb3VudCsrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7e3dpZHRoOiBpbnQsIGhlaWdodDogaW50fX0gZGltZW5zaW9uc1xuICAgICAqL1xuICAgIGVsZW1lbnRRdWVyeUVsZW1lbnQucHJvdG90eXBlLmRvUXVlcmllcyA9IGZ1bmN0aW9uIChkaW1lbnNpb25zKSB7XG4gICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZXMgPSB0aGlzLmdldEF0dHJpYnV0ZVZhbHVlcyhkaW1lbnNpb25zKTtcbiAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXMoYXR0cmlidXRlVmFsdWVzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHt7d2lkdGg6IGludCwgaGVpZ2h0OiBpbnR9fSBkaW1lbnNpb25zXG4gICAgICogQHJldHVybnMge3t9fVxuICAgICAqL1xuICAgIGVsZW1lbnRRdWVyeUVsZW1lbnQucHJvdG90eXBlLmdldEF0dHJpYnV0ZVZhbHVlcyA9IGZ1bmN0aW9uIChkaW1lbnNpb25zKSB7XG4gICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZXMgPSB7fTtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMucXVlcnlDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAvKiogQHZhciB7RWxlbWVudFF1ZXJ5fSAqL1xuICAgICAgICAgICAgdmFyIEVsZW1lbnRRdWVyeSA9IHRoaXMuYWxsUXVlcmllc1tpXTtcblxuICAgICAgICAgICAgaWYgKCFFbGVtZW50UXVlcnkuaXNNYXRjaEZvcihkaW1lbnNpb25zKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXR0ck5hbWUgPSBFbGVtZW50UXVlcnkuZ2V0QXR0cmlidXRlTmFtZSgpO1xuICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IEVsZW1lbnRRdWVyeS5nZXRQeFZhbHVlKCk7XG5cbiAgICAgICAgICAgIGlmICghYXR0cmlidXRlVmFsdWVzW2F0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlc1thdHRyTmFtZV0gPSBhdHRyVmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF0dHJpYnV0ZVZhbHVlc1thdHRyTmFtZV0uaW5kZXhPZihhdHRyVmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlc1thdHRyTmFtZV0gKz0gJyAnICsgYXR0clZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZVZhbHVlcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHt7fX0gYXR0cmlidXRlVmFsdWVzXG4gICAgICovXG4gICAgZWxlbWVudFF1ZXJ5RWxlbWVudC5wcm90b3R5cGUud3JpdGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGF0dHJpYnV0ZVZhbHVlcykge1xuICAgICAgICB2YXIgYWxsQXR0cmlidXRlcyA9IFsnbWluLXdpZHRoJywgJ21pbi1oZWlnaHQnLCAnbWF4LXdpZHRoJywgJ21heC1oZWlnaHQnXTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBsID0gYWxsQXR0cmlidXRlcy5sZW5ndGg7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZVZhbHVlc1thbGxBdHRyaWJ1dGVzW2ldXSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0RWxlbWVudC5zZXRBdHRyaWJ1dGUoYWxsQXR0cmlidXRlc1tpXSwgYXR0cmlidXRlVmFsdWVzW2FsbEF0dHJpYnV0ZXNbaV1dKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy50YXJnZXRFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhbGxBdHRyaWJ1dGVzW2ldKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBlbGVtZW50UXVlcnlFbGVtZW50LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWxldGUgdGhpcy50YXJnZXRFbGVtZW50O1xuICAgICAgICBkZWxldGUgdGhpcy5hbGxRdWVyaWVzO1xuICAgICAgICBkZWxldGUgdGhpcy5xdWVyeUNvdW50O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJuIHtudWxsfHtxdWVyaWVzOiBbXSwgY29uZmlnOiB7Y2xhc3NOYW1lVG9Ub2dnbGVBZnRlckluaXQ6IHN0cmluZ319fVxuICAgICAqL1xuICAgIGVsZW1lbnRRdWVyeUVsZW1lbnQucHJvdG90eXBlLmdldFZhbHVlT2ZEYXRhQXR0cmlidXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcXVlcnlEYXRhID0gSlNPTi5wYXJzZSh0aGlzLnRhcmdldEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWVsZW1lbnQtcXVlcmllcycpKTtcblxuICAgICAgICBpZiAoIXF1ZXJ5RGF0YSkge1xuICAgICAgICAgICAgY29uc29sZSAmJiBjb25zb2xlLmVycm9yKCdObyBjb25maWd1cmF0aW9uIGZvdW5kIGZvciBnaXZlbiBlbGVtZW50LiBDb25maWcgaXMgcGFzc2VkIHZpYSB0aGUgYGRhdGEtZWxlbWVudC1xdWVyaWVzYCBhdHRyaWJ1dGUuIEV4aXRpbmcuJywgdGhpcy50YXJnZXRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHF1ZXJ5RGF0YTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBlbGVtZW50UXVlcnlFbGVtZW50LnByb3RvdHlwZS5nZXRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGFyZ2V0RWxlbWVudC5pZDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGVsZW1lbnRRdWVyeVxuICAgICAqIEByZXR1cm5zIHt7bW9kZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRFbGVtZW50UXVlcnlQcm9wZXJ0aWVzKGVsZW1lbnRRdWVyeSkge1xuICAgICAgICB2YXIgcmVnZXggPSAvKG1pbnxtYXgpLSh3aWR0aHxoZWlnaHQpXFxzKjpcXHMqKFxcZCtweCkvbWdpO1xuICAgICAgICB2YXIgbWF0Y2ggPSByZWdleC5leGVjKGVsZW1lbnRRdWVyeSk7XG5cbiAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1vZGU6IG1hdGNoWzFdLFxuICAgICAgICAgICAgcHJvcGVydHk6IG1hdGNoWzJdLFxuICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzNdLnRvTG93ZXJDYXNlKClcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRFbGVtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHtlbGVtZW50UXVlcnlFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAodGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBlbGVtZW50UXVlcnlFbGVtZW50KHRhcmdldEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBlbGVtZW50UXVlcnlFbGVtZW50RmFjdG9yeTtcbiIsInZhciBlbGVtZW50UXVlcnlGYWN0b3J5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIHZhciBlbGVtZW50UXVlcnkgPSBmdW5jdGlvbiAobW9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgICAgIGlmIChtb2RlICE9PSAnbWluJyAmJiBtb2RlICE9PSAnbWF4Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG1vZGUgKHNob3VsZCBiZSBlaXRoZXIgYG1pbmAgb3IgYG1heGAuIEV4aXRpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvcGVydHkgIT09ICd3aWR0aCcgJiYgcHJvcGVydHkgIT09ICdoZWlnaHQnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcHJvcGVydHkgKHNob3VsZCBiZSBlaXRoZXIgYHdpZHRoYCBvciBgaGVpZ2h0YCkuIEV4aXRpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFsdWUgKHNob3VsZCBiZSBudW1lcmljKS4gRXhpdGluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAdmFyIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMubW9kZSA9IG1vZGU7XG4gICAgICAgIC8qKiBAdmFyIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMucHJvcGVydHkgPSBwcm9wZXJ0eTtcbiAgICAgICAgLyoqIEB2YXIge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy52YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuICAgICAgICAvKiogQHZhciB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnB4VmFsdWUgPSB2YWx1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBlbGVtZW50UXVlcnkucHJvdG90eXBlLmdldE1vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZWxlbWVudFF1ZXJ5LnByb3RvdHlwZS5nZXRQcm9wZXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydHk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZWxlbWVudFF1ZXJ5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZWxlbWVudFF1ZXJ5LnByb3RvdHlwZS5nZXRQeFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5weFZhbHVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3t3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn19IGRpbWVuc2lvbnNcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBlbGVtZW50UXVlcnkucHJvdG90eXBlLmlzTWF0Y2hGb3IgPSBmdW5jdGlvbiAoZGltZW5zaW9ucykge1xuICAgICAgICBpZiAodGhpcy5tb2RlID09PSAnbWluJyAmJiBkaW1lbnNpb25zW3RoaXMucHJvcGVydHldID49IHRoaXMudmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gJ21heCcgJiYgZGltZW5zaW9uc1t0aGlzLnByb3BlcnR5XSA8PSB0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBlbGVtZW50UXVlcnkucHJvdG90eXBlLmdldEF0dHJpYnV0ZU5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGUgKyAnLScgKyB0aGlzLnByb3BlcnR5O1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG1vZGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAgICAgKiBAcmV0dXJucyB7ZWxlbWVudFF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAobW9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGVsZW1lbnRRdWVyeShtb2RlLCBwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZWxlbWVudFF1ZXJ5RmFjdG9yeTtcbiIsInZhciByZWdpc3RyeSA9IChmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqIEB2YXIge3N0cmluZ30gKi9cbiAgICB2YXIgaWRQcmVmaXggPSAnZWxlbWVudC1xdWVyeS1lbGVtZW50LSc7XG4gICAgLyoqIEB2YXIge3tlbGVtZW50SWQ6IGVsZW1lbnRRdWVyeUVsZW1lbnR9fSAqL1xuICAgIHZhciBhbGxFbGVtZW50UXVlcnlFbGVtZW50cyA9IHt9O1xuICAgIC8qKiBAdmFyIGludCAqL1xuICAgIHZhciB1bmlxdWVJZFN1ZmZpeCA9IDA7XG4gICAgLyoqIEB2YXIge29iamVjdH0gKi9cbiAgICB2YXIgZWxlbWVudFF1ZXJ5RWxlbWVudEZhY3RvcnkgPSByZXF1aXJlKCcuL2VsZW1lbnRRdWVyeUVsZW1lbnRGYWN0b3J5Jyk7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG4gICAgICovXG4gICAgZnVuY3Rpb24gaWRlbnRpZnlFbGVtZW50ICh0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgIHZhciBlbGVtZW50SWQgPSB0YXJnZXRFbGVtZW50LmlkO1xuXG4gICAgICAgIGlmIChlbGVtZW50SWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnRJZCA9IGlkUHJlZml4ICsgKCsrdW5pcXVlSWRTdWZmaXgpO1xuICAgICAgICB0YXJnZXRFbGVtZW50LmlkID0gZWxlbWVudElkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBlbGVtZW50SWRcbiAgICAgKiBAcmV0dXJucyB7ZWxlbWVudFF1ZXJ5RWxlbWVudH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXQgKGVsZW1lbnRJZCkge1xuICAgICAgICBpZiAoIWFsbEVsZW1lbnRRdWVyeUVsZW1lbnRzW2VsZW1lbnRJZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFsbEVsZW1lbnRRdWVyeUVsZW1lbnRzW2VsZW1lbnRJZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRFbGVtZW50XG4gICAgICogQHJldHVybnMge2VsZW1lbnRRdWVyeUVsZW1lbnR9XG4gICAgICovXG4gICAgZnVuY3Rpb24gYWRkICh0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgIGlmIChnZXQodGFyZ2V0RWxlbWVudC5pZCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlkZW50aWZ5RWxlbWVudCh0YXJnZXRFbGVtZW50KTtcblxuICAgICAgICB2YXIgZWxlbWVudFF1ZXJ5RWxlbWVudCA9IGVsZW1lbnRRdWVyeUVsZW1lbnRGYWN0b3J5LmNyZWF0ZSh0YXJnZXRFbGVtZW50KTtcbiAgICAgICAgYWxsRWxlbWVudFF1ZXJ5RWxlbWVudHNbZWxlbWVudFF1ZXJ5RWxlbWVudC5nZXRJZCgpXSA9IGVsZW1lbnRRdWVyeUVsZW1lbnQ7XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnRRdWVyeUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtlbGVtZW50UXVlcnlFbGVtZW50fSBlbGVtZW50UXVlcnlFbGVtZW50XG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVtb3ZlIChlbGVtZW50UXVlcnlFbGVtZW50KSB7XG4gICAgICAgIGRlbGV0ZSBhbGxFbGVtZW50UXVlcnlFbGVtZW50c1tlbGVtZW50UXVlcnlFbGVtZW50LmdldElkKCldO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZ2V0LFxuICAgICAgICBhZGQ6IGFkZCxcbiAgICAgICAgcmVtb3ZlOiByZW1vdmVcbiAgICB9O1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWdpc3RyeTtcbiJdfQ==
