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
