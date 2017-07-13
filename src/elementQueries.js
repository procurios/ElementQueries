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