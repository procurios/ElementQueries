/**
 * @see (https://github.com/pesla/ElementQueries)
 * @author Peter Slagter
 * @copyright MIT
 * @preserve
 */

(function () {
	'use strict';

	var dependencies = ['droplet/ElementQueries/ElementQuery'];

	if (!('JSON' in window) || !('parse' in JSON)) {
		dependencies.push('vendor/json3/lib/json3.min');
	}
	if (!('classList' in document.createElement('p'))) {
		dependencies.push('vendor/classlist/classList.min.js');
	}

	define('droplet/ElementQueries/ElementQueryElement', dependencies,
		/**
		 * @param ElementQueryFactory
		 * @returns {ElementQueryElementFactory}
		 */
		function (ElementQueryFactory) {
			/**
			 * @param {HTMLElement} targetElement
			 * @constructor
			 */
			var ElementQueryElement = function (targetElement) {
				/** @var {HTMLElement} */
				this.targetElement = targetElement;
				/** @var {ElementQuery[]} */
				this.allQueries = [];
				/** @var {int} */
				this.queryCount = 0;

				/** @var {boolean} */
				this.toggleClassNameAfterInit = false;
				/** @var {string} */
				this.classNameToToggle = '';
			};

			ElementQueryElement.prototype.initialize = function () {
				/** @var {{queries: [], config: {classNameToToggleAfterInit: string}}} */
				var attributeData = this.getValueOfDataAttribute();

				if (!attributeData.queries) {
					console && console.log('error', 'No element queries found. Exiting.');
					return;
				}

				if (attributeData.config) {
					this.setConfig(attributeData.config);
				}

				this.addElementQueries(attributeData.queries);
				this.doQueries({width: this.targetElement.offsetWidth, height: this.targetElement.offsetHeight});

				if (this.toggleClassNameAfterInit) {
					this.targetElement.classList.toggle(this.classNameToToggle);
				}
			};

			/**
			 * @param {{classNameToToggleAfterInit: string}} config
			 */
			ElementQueryElement.prototype.setConfig = function (config) {
				if ('classNameToToggleAfterInit' in config && config.classNameToToggleAfterInit !== '') {
					this.toggleClassNameAfterInit = true;
					this.classNameToToggle = config.classNameToToggleAfterInit;
				}
			};

			ElementQueryElement.prototype.addElementQueries = function (elementQueries) {
				var j;
				var queryCount = elementQueries.length;

				for (j = 0; j < queryCount; j++) {
					var elementQuery = elementQueries[j];
					var queryProperties = getElementQueryProperties(elementQuery);

					if (!queryProperties) {
						console && console.error('Skipped element query as the query seems to be malformed.', elementQuery);
						continue;
					}

					var ElementQuery = ElementQueryFactory.create(queryProperties.mode, queryProperties.property, queryProperties.value);
					this.allQueries.push(ElementQuery);
					this.queryCount++;
				}
			};

			/**
			 * @param {{width: int, height: int}} dimensions
			 */
			ElementQueryElement.prototype.doQueries = function (dimensions) {
				var attributeValues = this.getAttributeValues(dimensions);
				this.writeAttributes(attributeValues);
			};

			/**
			 * @param {{width: int, height: int}} dimensions
			 * @returns {{}}
			 */
			ElementQueryElement.prototype.getAttributeValues = function (dimensions) {
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
						attributeValues[attrName] = [];
					}

					// Skip name-value pair that already exists
					var tempAttrValue = attributeValues[attrName].join(' ');
					if (tempAttrValue.indexOf(attrValue) !== -1) {
						continue;
					}

					attributeValues[attrName].push(attrValue);
				}

				return attributeValues;
			};

			/**
			 * @param {{}} attributeValues
			 */
			ElementQueryElement.prototype.writeAttributes = function (attributeValues) {
				var allAttributes = ['min-width', 'min-height', 'max-width', 'max-height'];
				var i;
				var l = allAttributes.length;

				for (i = 0; i < l; i++) {
					if (attributeValues[allAttributes[i]]) {
						this.targetElement.setAttribute(allAttributes[i], attributeValues[allAttributes[i]].join(' '));
						continue;
					}

					this.targetElement.removeAttribute(allAttributes[i]);
				}
			};

			/**
			 * @param {{width: int, height: int}} dimensions
			 */
			ElementQueryElement.prototype.callback = function (dimensions) {
				if (this.queryCount === 0) {
					return;
				}

				this.doQueries(dimensions);
			};

			ElementQueryElement.prototype.destroy = function () {
				delete this.targetElement;
				delete this.allQueries;
				delete this.queryCount;
			};

			/**
			 * @return {null|{queries: [], config: {classNameToToggleAfterInit: string}}}
			 */
			ElementQueryElement.prototype.getValueOfDataAttribute = function () {
				var queryData = JSON.parse(this.targetElement.getAttribute('data-element-queries'));

				if (!queryData) {
					console && console.error('No configuration found for given element. Config is passed via the `data-element-queries` attribute. Exiting.', this.targetElement);
					return null;
				}

				return queryData;
			};

			/**
			 * @param {string} elementQuery
			 * @returns {{mode: string, property: string, value: string}}
			 */
			function getElementQueryProperties(elementQuery) {
				var regex = /(min|max)-(width|height)[\s\t]*:[\s\t]*(\d+px)/mgi;
				var match = regex.exec(elementQuery);

				if (!match) {
					return false;
				}

				return {
					mode: match[1],
					property: match[2],
					value: match[3]
				};
			}

			/**
			 * @constructor
			 */
			var ElementQueryElementFactory = function () {
			};

			ElementQueryElementFactory.prototype = {
				/**
				 * @param {HTMLElement} targetElement
				 * @returns {ElementQueryElement}
				 */
				create: function (targetElement) {
					return new ElementQueryElement(targetElement);
				}
			};

			return new ElementQueryElementFactory();
		}
	);
})();