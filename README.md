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

This library is used in production (and maintained) by [Procurios](htts://procurios.com). It's tested on Chrome, Safari, Opera, Firefox and IE7+. Internet Explorer uses the native available `onresize` event on elements.

## Installation

How you load this library (synchronous or asynchronous) is entirely up to you. It uses the `requirejs` ecosystem for defining and loading the modules, so you'll likely have to review and adjust the paths to fit your needs. It depends on [`ResizeSensor`](https://github.com/procurios/ResizeSensor), so make sure it's available.

### `data-element-queries` attribute
The element queries that apply to an element are defined in the `data-element-queries` attribute. It's a simple JSON string:



### Asyncronous loading
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


```css
.your-component {
    padding: 25px;
}

.your-component[max-width~="400px"] {
    padding: 55px;
}

.your-component[max-width~="200px"] {
    padding: 0;
}

.another-component[max-width~="400px"] li {
    display: inline-block;
}
 
.another-component[min-width="400px"] li {
    display: block;
}
```

## Installation

ElementQueries.js depends on `domLoad` and `ResizeSensor.js`.

@todo: describe how to implement.

In short, the Javascript:

1. Reads all CSSRules and grabs selectors that match [min|max]-[width|height].
2. Filters out invalid selectors and breaks them into usable pieces.
3. Initializes resize detection for each valid selector.
4. Fires a callback whenever an element has resized.
5. Determines whether or not one of the element queries apply to the current element dimensions and sets the related attribute.

## Remarks

- Does not work on `img` and other elements that can't contain other elements. Wrapping with a `div` works fine.
- The resize detector adds additional elements into the target element. The target element is forced to be `position: relative;`.

## License
MIT license.