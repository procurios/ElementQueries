/**
 * @see (https://github.com/pesla/ElementQueries)
 * @author Peter Slagter
 * @license MPL version 2.0
 * @preserve
 */

define('droplet/ElementQueries/ElementQuery',
	/**
	 * @returns {ElementQueryFactory}
	 */
	function () {
		'use strict';

		/**
		 * @param {string} mode
		 * @param {string} property
		 * @param {string} value
		 * @constructor
		 */
		var ElementQuery = function (mode, property, value) {
			if (mode !== 'min' && mode !== 'max') {
				console && console.error('Invalid mode (should be either `min` or `max`. Exiting.');
				return;
			}

			if (property !== 'width' && property !== 'height') {
				console && console.error('Invalid property (should be either `width` or `height`). Exiting.');
				return;
			}

			if (isNaN(parseFloat(value))) {
				console && console.error('Invalid value (shoulld be numeric). Exiting.');
				return;
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
		ElementQuery.prototype.getMode = function () {
			return this.mode;
		};

		/**
		 * @returns {string}
		 */
		ElementQuery.prototype.getProperty = function () {
			return this.property;
		};

		/**
		 * @returns {number}
		 */
		ElementQuery.prototype.getValue = function () {
			return this.value;
		};

		/**
		 * @returns {string}
		 */
		ElementQuery.prototype.getPxValue = function () {
			return this.pxValue;
		};

		/**
		 * @param {{width: number, height: number}} dimensions
		 * @returns {boolean}
		 */
		ElementQuery.prototype.isMatchFor = function (dimensions) {
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
		ElementQuery.prototype.getAttributeName = function () {
			return this.mode + '-' + this.property;
		};

		/**
		 * @constructor
		 */
		var ElementQueryFactory = function () {};

		ElementQueryFactory.prototype = {
			/**
			 * @param {string} mode
			 * @param {string} property
			 * @param {string} value
			 * @returns {ElementQuery}
			 */
			create: function (mode, property, value) {
				return new ElementQuery(mode, property, value);
			}
		};

		return new ElementQueryFactory();
	}
);