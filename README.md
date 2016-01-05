Element Queries
===================

Media queries allow you to query the dimensions of the browser viewport. Unfortunately, that isn't enough to create independent and isolated UI components.
Element Queries aims to bridge that gap and adds support for element based media-queries.

This library is inspired by [@marcj's EQ library](https://github.com/marcj/css-element-queries/) and @csuwildcat's [blogpost](http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/) on resize detection for elements.

Features:

- Vanilla Javascript (except for depending on `requirejs` for module loading / definitions).
- Performs very well: No use of `window.onresize`, but a combination of `scroll` events and `window.requestAnimationFrame`.
- No intervals/timeouts.
- Supports and tested in Webkit, Gecko and IE(7/8/9/10/11).
- Supports `min-width`, `min-height`, `max-width` and `max-height` declarations.

## Browser Support

This library is used in production (and maintained) by [Procurios](https://procurios.com). It's tested on Chrome, Safari, Opera, Firefox and IE7+. Internet Explorer uses its native `onresize` event available for elements.

## Usage

How you load this library (synchronous or asynchronous) is entirely up to you. It uses the `requirejs` ecosystem for defining and loading the modules, so you'll likely have to review and adjust the paths to fit your needs. It depends on [`ResizeSensor`](https://github.com/procurios/ResizeSensor), so make sure it's available.

### Javascript

#### Loading asynchronous

```js
<script>
	require(['droplet/ElementQueries/ElementQueriesApi'],
		function (ElementQueriesApi) {
			// Do stuff, eg. initialize all element queries
			ElementQueriesApi.initializeMultiple('MainContent__contentContainer');
		}
	);
</script>
```

#### Loading Synchronous

Because the modules are named, it's possible to just include the necessary script files in your document:

```html
<script src='path/to/ElementQueriesApi.js'></script>
<script src='path/to/ElementQueryElement.js'></script>
<script src='path/to/ElementQuery.js'></script>
<script src='path/to/ResizeSensorApi.js'></script>
<script src='path/to/ResizeSensor.js'></script>
```

This will block rendering, which might be preferable if drawing a specific component needs to be (close to) instant.

#### ElementQueriesApi

The public `ElementQueriesApi` provides the following methods.

```js
// Initializes element queries for a single element
ElementQueriesApi.initializeSingle('elementId');

// Initializes element queries for multiple elements inside element with `parentId`
ElementQueriesApi.initializeMultiple('parentId');

// Destroys element queries for a single element
ElementQueriesApi.destroySingle('elementId');

// Destroys element queries for multiple elements inside element with `parentId`
ElementQueriesApi.destroyMultiple('parentId');
```

Make sure to destroy existing element queries before creating new ones (eg. when updating your page / component as the result of an Ajax call). This makes sure all references are destroyed and can be garbage collected.

### HTML

The element queries that apply to an element are defined in the `data-element-queries` attribute. It's a simple JSON string:

```json
{
    "queries": [
        "min-width:980px",
        "max-width:700px"
    ],
    "config": {
        "classNameToToggleAfterInit": "YourComponent--visible"
    }
}
```

The property `queries` is required. Additional `config` is optional. The actual HTML would look as following:

```html
<div id='YourComponent' class='YourComponent' data-element-queries='{"queries":["min-width:980px","max-width:700px"],"config":{"classNameToToggleAfterInit":"YourComponent--visible"}}'></div>
```

If you don't want to write JSON by hand, you can use the included PHP class `ElementQueriesAttribute`:

```php
$EQAttribute = new ElementQueriesAttribute();
$EQAttribute->addQuery(ElementQueriesAttribute::MODE_MIN, ElementQueriesAttribute::PROPERTY_WIDTH, 500);
$attributeValue = $EQAttribute->asString(); // $attributeValue => data-element-queries='{"queries":["min-width:500px"]}'
```

#### Configuration

The following addition configuration is supported:

`classNameToToggleAfterInit` {`string`}: Toggles given classname on the target element after initializing its element queries. Example usage: toggling visibility, CSS transitions or animations.

### CSS

If one or more provided element queries match the elements dimensions, the value is written to one of the following attributes: `min-width`, `max-width`, `min-height`, `max-height`. Use these attributes in your CSS via attribute selectors. For example:

```css
.YourComponent {
	padding: 10px;
}

.YourComponent[min-width~="500px"] {
    padding: 25px;
}

.YourComponent[min-width~="800px"] {
    padding: 50px;
}
```

## License

MIT (see LICENSE)