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
