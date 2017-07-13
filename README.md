elementQueries.js
===================

Media queries allow you to query the dimensions of the browser viewport. Unfortunately, that isn't enough to create independent
and isolated UI components. Element Queries aims to bridge that gap and adds support for element based media-queries.

This library is inspired by [@marcj's EQ library](https://github.com/marcj/css-element-queries/) and @csuwildcat's
[blogpost](http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/) on resize detection
for elements.

Features:

- Vanilla Javascript.
- Performs very well: No use of `window.onresize`, but a combination of `scroll` events and `window.requestAnimationFrame`.
- No intervals/timeouts.
- Supports and tested in Webkit, Gecko and IE(7/8/9/10/11).
- Supports `min-width`, `min-height`, `max-width` and `max-height` declarations.

## Browser Support*__*

This library is used in production (and maintained) by [Procurios](https://procurios.com). It's tested on Chrome, Safari,
Opera, Firefox and IE8+. Internet Explorer uses its native `onresize` event available for elements.

## Usage

How you load this library (synchronous or asynchronous) is entirely up to you. The library is wrapped by the UMD, so it 
can register itself as global, be loaded by an AMD loader or used as a common JS module. We recommend loading it synchronously 
if your user interface depends on element queries being processed.

### Javascript

It depends on [`resizeSensor.js`](https://github.com/procurios/ResizeSensor), so make sure it's available. You can bring 
your own resize detection, by registering a global or loading a module named `resizeSensor` that exposes the necessary
methods.

```html
<!-- Synchronous -->
<script src='dist/resizeSensor.min.js'></script>
<script src='dist/elementQueries.min.js'></script>

<!-- Asynchronous -->
<script>
	require(['elementQueries'],
		function (elementQueries) {
			elementQueries.initializeMultiple('fooBar');
		}
	);
</script>
```

#### Api

The public api consists of the following methods:

```js
// Initializes element queries for a single element
elementQueries.initializeSingle('elementId');

// Initializes element queries for multiple elements inside element with `parentId`
elementQueries.initializeMultiple('parentId');

// Destroys element queries for a single element
elementQueries.destroySingle('elementId');

// Destroys element queries for multiple elements inside element with `parentId`
elementQueries.destroyMultiple('parentId');
```

Make sure to destroy existing element queries before creating new ones (eg. when updating your page / component as the 
result of an Ajax call). This makes sure all references are destroyed and can be garbage collected.

#### Configuration

The following addition configuration is supported:

- `classNameToToggleAfterInit` (`string`): Toggles given classname on the target element after initializing its element 
queries. Example usage: toggling visibility, CSS transitions or animations.

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
$attribute = new ElementQueriesAttribute();
$attribute->addQuery(ElementQueriesAttribute::MODE_MIN, ElementQueriesAttribute::PROPERTY_WIDTH, 500);
$attributeValue = $attribute->asString(); // data-element-queries='{"queries":["min-width:500px"]}'
```

### CSS

If one or more provided element queries match the elements dimensions, the value is written to one of the following 
attributes: `min-width`, `max-width`, `min-height`, `max-height`. Use these attributes in your CSS via attribute selectors.
For example:

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