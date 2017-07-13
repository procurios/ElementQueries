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
