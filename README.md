# Frost UI StarRating

[![CI](https://github.com/frost-js/ui-starrating/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/frost-js/ui-starrating/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/frost-js/ui-starrating/branch/main/graph/badge.svg)](https://codecov.io/gh/frost-js/ui-starrating)
[![npm version](https://img.shields.io/npm/v/%40fr0st%2Fui-starrating?style=flat-square)](https://www.npmjs.com/package/@fr0st/ui-starrating)
[![npm downloads](https://img.shields.io/npm/dm/%40fr0st%2Fui-starrating?style=flat-square)](https://www.npmjs.com/package/@fr0st/ui-starrating)
[![JS gzip size](https://img.badgesize.io/frost-js/ui-starrating/main/dist/frost-ui-starrating.min.js?compression=gzip&label=JS%20gzip%20size&style=flat-square)](https://github.com/frost-js/ui-starrating/blob/main/dist/frost-ui-starrating.min.js)
[![CSS gzip size](https://img.badgesize.io/frost-js/ui-starrating/main/dist/frost-ui-starrating.min.css?compression=gzip&label=CSS%20gzip%20size&style=flat-square)](https://github.com/frost-js/ui-starrating/blob/main/dist/frost-ui-starrating.min.css)
[![license](https://img.shields.io/github/license/frost-js/ui-starrating?style=flat-square)](./LICENSE)

Accessible star-rating control for Frost UI with fractional values, configurable ranges and star counts, tooltips, keyboard navigation, mouse and touch input, and RTL support.

## Highlights

- Native number input remains the form control and source of truth
- Integer, fractional, exponent, and unrestricted `step="any"` values
- Configurable minimum, maximum, star count, rating text, and five sizes
- Keyboard, mouse, touch drag, and optional hover-preview interaction
- Direction-aware filling, pointer values, and horizontal keys in RTL
- Accessible slider state, native labels, required and disabled state, and display-only mode
- Frost UI v3 light, dark, system, reduced-motion, focus, and forced-colors presentation
- Native `StarRating` class and `starrating` fQuery plugin
- Existing-instance reuse with frozen resolved options
- Reversible disposal that restores the input's original visibility and `tabindex`
- Prebuilt ESM and UMD bundles plus expanded and minified CSS, all with source maps
- JSDoc-powered IntelliSense

## Browser support

StarRating follows Frost UI's modern Baseline browser policy. JavaScript bundles target Vite's `baseline-widely-available` target, while stylesheet processing uses the package's `baseline newly available` Browserslist query.

Continuous integration runs the browser suite in Chromium on Node 20, 22, and 24, and in Firefox and WebKit on Node 24. Internet Explorer is not supported. StarRating requires a browser DOM or a compatible DOM environment configured through fQuery; server-rendered applications should load it on the client.

## Installation

### Browser projects / bundlers

Install StarRating with its Frost UI and fQuery peers:

```bash
npm i @fr0st/ui-starrating @fr0st/ui @fr0st/query
```

Import both required stylesheets and the default component export:

```js
import '@fr0st/ui/dist/frost-ui.min.css';
import '@fr0st/ui-starrating/dist/frost-ui-starrating.min.css';
import StarRating from '@fr0st/ui-starrating';

const rating = StarRating.init(
    document.querySelector('#product-rating'),
    {
        stars: 5,
        step: .5,
    },
);
```

`@fr0st/ui` and `@fr0st/query` are peer dependencies, so StarRating shares the application's UI and fQuery instances instead of bundling duplicate copies.

The package root resolves to `dist/frost-ui-starrating.esm.js`. The package root, `dist/*`, and `src/*` are available through package exports; other undeclared subpaths are intentionally blocked. `main` and `module` both reference the compiled ESM build, while `jsdelivr` and `unpkg` reference the minified UMD build.

### Browser (ESM)

The ESM bundle imports `@fr0st/ui` and `@fr0st/query`. Frost UI and fQuery also require `@fr0st/core`, so map all three dependencies when loading the bundle directly in a browser:

```html
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui.min.css">
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@fr0st/ui-starrating@latest/dist/frost-ui-starrating.min.css">

<script type="importmap">
{
    "imports": {
        "@fr0st/core": "https://cdn.jsdelivr.net/npm/@fr0st/core@latest/dist/frost-core.esm.min.js",
        "@fr0st/query": "https://cdn.jsdelivr.net/npm/@fr0st/query@latest/dist/fquery.esm.min.js",
        "@fr0st/ui": "https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui.esm.min.js"
    }
}
</script>
<script type="module">
    import StarRating from 'https://cdn.jsdelivr.net/npm/@fr0st/ui-starrating@latest/dist/frost-ui-starrating.esm.min.js';

    StarRating.init(document.querySelector('#product-rating'));
</script>
```

### Browser (UMD)

Load Frost UI's all-in-one bundle before StarRating. The UI bundle supplies both globals expected by the component:

```html
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui.min.css">
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@fr0st/ui-starrating@latest/dist/frost-ui-starrating.min.css">

<script src="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui-bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@fr0st/ui-starrating@latest/dist/frost-ui-starrating.min.js"></script>
<script>
    const rating = UI.StarRating.init(
        document.querySelector('#product-rating'),
    );
</script>
```

The UMD bundle adds `StarRating` to the existing `globalThis.UI` object. It expects `globalThis.UI` and `globalThis.fQuery` to exist before it loads. If the non-bundled Frost UI build is used instead, load fQuery, Frost UI, and StarRating in that order.

## Usage

Start with a normal number input and an explicit or wrapping label. StarRating inserts the visible slider immediately before the input and visually hides the original control while keeping its value synchronized for forms:

```html
<label for="product-rating">Product rating</label>
<input
    id="product-rating"
    name="rating"
    type="number"
    min="1"
    max="5"
    step="0.5"
    value="3.5"
    required>
```

```js
import StarRating from '@fr0st/ui-starrating';

const rating = StarRating.init(
    document.querySelector('#product-rating'),
    {
        ratingText(value) {
            return `${value} out of 5 stars`;
        },
    },
);

console.log(rating.getValue()); // 3.5
```

Calling `StarRating.init()` again for the same input returns its existing instance. Dispose the current instance before reinitializing the input with different options.

## Options

Component options are resolved in this order:

1. `StarRating.defaults`
2. The input's `data-ui-*` attributes
3. Options passed to `StarRating.init()`

Resolved `instance.options` are frozen. Native input state is then applied without modifying that object: `min`, `max`, and `step` attributes override their matching resolved options; native `readonly` enables display-only behavior; and the input's current value supplies the initial rating. Native `disabled`, `required`, labels, ARIA attributes, and direction also remain authoritative.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `animate` | `boolean` | `true` | Animate committed rating changes using Frost UI transition tokens. |
| `displayOnly` | `boolean` | `false` | Present a focusable, read-only rating without editing handlers. Native `readonly` also enables this mode. |
| `hover` | `boolean` | `true` | Preview the pointer rating without committing it. |
| `max` | `number \| null` | `null` | Set the effective maximum. `null` uses the rendered star count. |
| `min` | `number` | `0` | Set the effective minimum. |
| `ratingText` | `(rating: number) => string` | Singular/plural star text | Create tooltip content and `aria-valuetext`. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Select the component font size. |
| `stars` | `number` | `5` | Set the number of rendered stars. Values are normalized to a positive integer. |
| `step` | `number \| 'any'` | `1` | Set the rating increment. `'any'` allows unrestricted finite values. |
| `tooltip` | `boolean` | `true` | Show rating text during focus, hover, and drag interaction. |

```js
const rating = StarRating.init(node, {
    animate: true,
    displayOnly: false,
    hover: true,
    max: 8,
    min: 2,
    ratingText: (value) => `Score ${value} of 8`,
    size: 'lg',
    stars: 10,
    step: .25,
    tooltip: true,
});
```

The effective range is clamped between zero and the rendered star count. Finite values are clamped to that range. Numeric steps are anchored at the effective minimum, and intermediate values advance to the next valid step; the exact minimum and maximum remain selectable. Decimal and exponent precision is preserved. Invalid or non-finite programmatic values are ignored, and invalid steps safely behave like `step="any"`.

## Data attributes

Options other than `ratingText` can be supplied through `data-ui-*` attributes:

| Attribute | Example |
| --- | --- |
| `data-ui-animate` | `data-ui-animate="false"` |
| `data-ui-display-only` | `data-ui-display-only="true"` |
| `data-ui-hover` | `data-ui-hover="false"` |
| `data-ui-max` | `data-ui-max="8"` |
| `data-ui-min` | `data-ui-min="2"` |
| `data-ui-size` | `data-ui-size="lg"` |
| `data-ui-stars` | `data-ui-stars="10"` |
| `data-ui-step` | `data-ui-step="0.25"` |
| `data-ui-tooltip` | `data-ui-tooltip="false"` |

```html
<input
    id="product-rating"
    type="number"
    data-ui-toggle="starrating"
    data-ui-size="lg"
    data-ui-stars="10"
    min="2"
    max="8"
    step="0.25"
    value="6.5">
```

The component still needs to be initialized through the class or fQuery plugin. The demo uses `data-ui-toggle="starrating"` as a shared initialization selector:

```js
$('[data-ui-toggle="starrating"]').starrating();
```

The `data-ui-toggle` attribute does not initialize StarRating by itself. Use native `min`, `max`, `step`, and `readonly` when those constraints are part of the input's form semantics.

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| `StarRating.init(node, options?)` | `StarRating` | Return the existing instance for an input or create one. |
| `disable()` | `void` | Disable the number input and make the rendered slider unavailable and unfocusable. |
| `dispose()` | `void` | Remove generated markup and events, unregister component state, and restore the original input. |
| `enable()` | `void` | Enable the number input and restore slider interaction. |
| `getValue()` | `number \| null` | Return the current finite rating, or `null` when the input is empty or invalid. |
| `setValue(value)` | `void` | Normalize, clamp, snap, display, and commit a finite rating. |

```js
rating.setValue(4.5);
console.log(rating.getValue()); // 4.5

rating.disable();
rating.enable();
rating.dispose();
```

An instance exposes its original input as `instance.node` and its frozen resolved configuration as `instance.options`. Both become `null` after disposal.

## Events

StarRating emits one namespaced fQuery event from the original number input when a component-driven action commits a distinct normalized rating:

| Event | Description |
| --- | --- |
| `change.ui.starrating` | The value changed through keyboard, mouse, touch, or `setValue()`. |

```js
import $ from '@fr0st/query';

$.addEvent(
    '#product-rating',
    'change.ui.starrating',
    (event) => {
        console.log(event.currentTarget.value);
    },
);
```

The underlying event type is `change`; fQuery exposes `event.namespace` as `ui.starrating`. Setting or selecting the current normalized value again does not emit another event. Hover preview changes only the visible fill and tooltip; it does not commit a value or change the slider's accessible value. A change event dispatched on the input refreshes the rendered control from the native value.

## fQuery API

Importing StarRating registers `starrating` on `fQuery.QuerySet`:

```js
import $ from '@fr0st/query';
import '@fr0st/ui-starrating';

const rating = $('#product-rating').starrating({
    size: 'lg',
    step: .5,
});

$('#product-rating').starrating('setValue', 4.5);

const value = $('#product-rating').starrating('getValue');

$('#product-rating').starrating('disable');
$('#product-rating').starrating('enable');
$('#product-rating').starrating('dispose');
```

Pass an options object to initialize every matched input, or pass a public method name followed by its arguments. The first component or method result is returned.

## Accessibility and keyboard behavior

- The rendered control uses `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-required`, `aria-readonly`, and `aria-disabled`.
- Explicit labels, wrapping labels, multiple labels, and existing `aria-labelledby` references contribute to the rendered slider's accessible name.
- An input `aria-label` is copied when no label references are available.
- Labels without IDs receive temporary generated IDs while the component is active.
- The rendered slider enters the tab order while the original input becomes visually hidden and receives `tabindex="-1"`.
- Arrow Up and Arrow Down increase and decrease by one step. Arrow Left and Arrow Right are direction-aware. Page Up and Page Down change by one whole rating point. Home and End select the effective minimum and maximum.
- Handled slider keys prevent page scrolling.
- Disabled ratings leave the tab order and ignore keyboard and pointer interaction.
- Display-only and native read-only ratings expose `aria-readonly="true"`, remain focusable, and do not install editing handlers.
- The original input remains the submitted form field and preserves native value, required, disabled, min, max, and step semantics.

Applications remain responsible for a meaningful label, instructions, validation feedback, and sufficient contrast when overriding the component color. `ratingText` should describe the rating in the surrounding language and scale.

## Customization

The public static `defaults`, `classes`, `icons`, and `lang` objects can be customized before initialization:

```js
StarRating.defaults.tooltip = false;
StarRating.lang.star = 'point';
StarRating.lang.stars = 'points';
StarRating.icons.filled = '<svg aria-hidden="true" ...></svg>';
StarRating.icons.outline = '<svg aria-hidden="true" ...></svg>';
```

`StarRating.classes` exposes the generated class names for animation, the slider container, disabled state, filled and outline layers, and input hiding. Custom icons should remain decorative because the slider's accessible value comes from ARIA and `ratingText`.

The component stylesheet exposes these CSS custom properties:

| Property | Purpose |
| --- | --- |
| `--ui-starrating-font-size` | Star size for the current variant. |
| `--ui-starrating-color` | Outline and fill color. |
| `--ui-starrating-focus-box-shadow` | Focus-visible ring. |
| `--ui-starrating-disabled-opacity` | Disabled opacity. |

```css
.product-score .starrating {
    --ui-starrating-color: var(--ui-success);
}
```

## Themes and RTL

StarRating combines its component stylesheet with Frost UI v3 transition, focus-ring, disabled, and reduced-motion tokens. Frost UI follows the user's preferred color scheme by default. Set `data-ui-theme="light"` or `data-ui-theme="dark"` on the document or an ancestor to select a theme explicitly:

```html
<section data-ui-theme="dark">
    <label for="dark-rating">Dark theme rating</label>
    <input id="dark-rating" type="number" value="4">
</section>
```

Normal document and ancestor direction is respected. A `dir` attribute placed directly on the original input is copied to the rendered slider:

```html
<input id="rtl-rating" type="number" value="4" dir="rtl">
```

In RTL layouts, fill begins at the inline start, pointer values are mirrored, and Arrow Left increases while Arrow Right decreases. Vertical keys, Home, End, and Page keys retain their normal meaning. Forced-colors mode replaces the star and focus colors with system colors.

## Disposal

`dispose()` removes the rendered rating, component events, active drag state, tooltip state, and registered fQuery component data. It restores the input's pre-existing visually-hidden state and `tabindex` while preserving unrelated or runtime-added classes.

Generated label IDs are removed only when they still contain the component-generated value. Existing IDs and IDs changed by the application remain untouched. The input's current value and disabled state are preserved. Removing the original input through fQuery also disposes the component automatically.

```js
rating.dispose();

// The same input can now be initialized with different options.
const compactRating = StarRating.init(node, { size: 'sm' });
```

## Development

Development requires Node `^20.19.0`, `^22.13.0`, or `>=24`.

The npm override keeps `baseline-browser-mapping` at `2.11.20`: newer mapping data currently makes `baseline newly available` resolve to no browsers with the installed Can I Use data, removing required CSS prefixes. Revisit the override when those datasets align, and verify the resolved browser targets and generated CSS before removing it.

```bash
npm ci
npm test
npm run lint
npm run lint:sass:unused
npm run build
npm run test:browser
npm run test:coverage
```

`npm test` builds the bundles and runs the Playwright suite in Chromium, Firefox, and WebKit. Use `npm run test:headed` for headed browsers or `npm run test:ui` for Playwright's interactive runner.

## License

Frost UI StarRating is released under the [MIT License](./LICENSE).
