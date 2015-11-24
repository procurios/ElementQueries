/**
 * @see (https://github.com/pesla/ElementQueries)
 * @author Peter Slagter
 * @license MPL version 2.0
 * @preserve
 */

(function () {
	'use strict';

	var dependencies = ['droplet/ElementQueries/ElementQueryElement', 'droplet/ResizeSensor/ResizeSensorApi'];

	if (typeof document.querySelectorAll !== 'function') {
		dependencies.push('droplet/QuerySelectorAllPolyfill/QuerySelectorAllPolyfill');
	}

	define('droplet/ElementQueries/ElementQueriesApi', dependencies,

		/**
		 * @param ElementQueryElementFactory
		 * @param ResizeSensorApi
		 */
		function (ElementQueryElementFactory, ResizeSensorApi) {

			/** @var {string} */
			var dataAttrName = 'data-element-queries';
			/** @var {string} */
			var idPrefix = 'element-query-element-';

			/**
			 * @constructor
			 */
			var PrivateElementQueriesApi = function () {
				/** @var {{elementId: {instance: ElementQueryElement, callback: Function}}} */
				this.allElementQueryElements = {};
				/** @var int */
				this.allElementQueryElementsCount = 0;
			};

			/**
			 * @param {string} targetElementId
			 */
			PrivateElementQueriesApi.prototype.initializeSingle = function (targetElementId) {
				var targetElement = document.querySelector(getCssSelector(targetElementId));

				if (!targetElement) {
					console && console.info('No valid element found for given selector. Exiting.', getCssSelector(targetElementId));
					return;
				}

				this.initializeElementQueries([targetElement]);
			};

			/**
			 * @param {string} parentElementId
			 */
			PrivateElementQueriesApi.prototype.initializeMultiple = function (parentElementId) {
				var targetElements = document.querySelectorAll(getCssSelector(parentElementId, true));

				if (targetElements.length === 0) {
					console && console.info('No valid elements found for given selector. Exiting.', getCssSelector(parentElementId, true));
					return;
				}

				this.initializeElementQueries(targetElements);
			};

			/**
			 * @param {NodeList|[]} targetElements
			 */
			PrivateElementQueriesApi.prototype.initializeElementQueries = function (targetElements) {
				var i;
				var elementCount = targetElements.length;

				for (i = 0; i < elementCount; i++) {
					var targetElement = targetElements[i];
					var elementId = this.identifyElement(targetElement);

					/** @var ElementQueryElement */
					var ElementQueryElement = this.getElementQueryElementByElementId(elementId);

					if (ElementQueryElement) {
						console && console.info('A `ElementQueryElement` for given elementId already exists. If you need to reset it, destroy existing one first.', elementId);
						continue;
					}

					ElementQueryElement = ElementQueryElementFactory.create(targetElement);
					ElementQueryElement.initialize();

					this.allElementQueryElements[elementId] = { instance: ElementQueryElement, callback: '' };
					this.allElementQueryElementsCount++;

					// Attach a ResizeSensor to the target element to update it's dimensions as it resizes
					this.allElementQueryElements[elementId].callback = ElementQueryElement.callback.bind(ElementQueryElement);
					ResizeSensorApi.create(targetElement, this.allElementQueryElements[elementId].callback);
				}
			};

			/**
			 * @param {HTMLElement} targetElement
			 * @returns {string}
			 */
			PrivateElementQueriesApi.prototype.identifyElement = function (targetElement) {
				var elementId = targetElement.id;

				if (elementId) {
					return elementId;
				}

				elementId = idPrefix + this.allElementQueryElementsCount;
				targetElement.id = elementId;
				return elementId;
			};

			/**
			 * @param {string} elementId
			 * @returns {ElementQueryElement}
			 */
			PrivateElementQueriesApi.prototype.getElementQueryElementByElementId = function (elementId) {
				if (!this.allElementQueryElements[elementId]) {
					return null;
				}

				var ElementQueryElement = this.allElementQueryElements[elementId].instance;

				if (!ElementQueryElement) {
					return null;
				}

				return this.allElementQueryElements[elementId].instance;
			};

			/**
			 * @param {string} parentElementId
			 */
			PrivateElementQueriesApi.prototype.destroyMultiple = function (parentElementId) {
				var selector = '#' + parentElementId + ' [' + dataAttrName + ']';
				var targetElements = document.querySelectorAll(selector);
				var elementCount = targetElements.length;

				if (elementCount === 0) {
					console && console.info('No elements found for given selector. Exiting.', parentElementId, selector);
				}

				this.destroyElementQueries(targetElements);
			};

			/**
			 * @param {string} targetElementId
			 */
			PrivateElementQueriesApi.prototype.destroySingle = function (targetElementId) {
				var targetElement = document.querySelector(getCssSelector(targetElementId));

				if (!targetElement) {
					console && console.info('No valid element found for given selector. Exiting.');
					return;
				}

				this.destroyElementQueries([targetElement]);
			};

			/**
			 * @param {NodeList|[]} targetElements
			 */
			PrivateElementQueriesApi.prototype.destroyElementQueries = function (targetElements) {
				var i;
				var elementCount = targetElements.length;

				for (i = 0; i < elementCount; i++) {
					var targetElement = targetElements[i];
					var targetElementId = targetElement.id;

					/** @var ElementQueryElement */
					var ElementQueryElement = this.getElementQueryElementByElementId(targetElementId);

					if (!ElementQueryElement) {
						console && console.info("Can't destroy `ElementQueryElement` (404 not found).", targetElement);
						continue;
					}

					ElementQueryElement.destroy();
					ResizeSensorApi.destroy(targetElement);
					delete this.allElementQueryElements[targetElementId].callback;
					delete this.allElementQueryElements[targetElementId];
				}
			};

	/** ----- Private helper functions ----- */

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

			var Api = new PrivateElementQueriesApi();

			/**
			 *
			 * @type {{initializeSingle: (function(targetElementId)), initializeMultiple: (function(parentElementId)), destroySingle: (function(targetElementId), destroyMultiple: (parentElementId)}}
			 */
			var ElementQueriesApi = {
				initializeSingle: Api.initializeSingle.bind(Api),
				initializeMultiple: Api.initializeMultiple.bind(Api),
				destroySingle: Api.destroySingle.bind(Api),
				destroyMultiple: Api.destroyMultiple.bind(Api)
			};

			return ElementQueriesApi;
		}
	);

})();