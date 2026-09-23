import $ from '@fr0st/query';
import { BaseComponent, generateId, getPosition, Tooltip } from '@fr0st/ui';

const window = $.getWindow();

/**
 * @typedef {object} StarRatingOptions
 * @property {boolean} [animate=true] Whether to animate rating changes.
 * @property {boolean} [displayOnly=false] Whether the rating is read-only.
 * @property {boolean} [hover=true] Whether pointer movement previews a rating.
 * @property {number|null} [max=null] The maximum rating, or `null` to use the star count.
 * @property {number} [min=0] The minimum rating.
 * @property {((rating: number) => string)} [ratingText] Returns the accessible text for a rating.
 * @property {'xs'|'sm'|'md'|'lg'|'xl'} [size='md'] The rating size suffix.
 * @property {number} [stars=5] The number of rendered stars.
 * @property {number|'any'} [step=1] The rating increment, or `any` for unrestricted values.
 * @property {boolean} [tooltip=true] Whether to display rating text in a tooltip.
 */

/**
 * Controls a numeric input using an accessible star rating interface.
 * @augments {BaseComponent<StarRatingOptions>}
 */
export default class StarRating extends BaseComponent {
    #container;
    #displayOnly = false;
    #dragging = false;
    #filledContainer;
    #form;
    #generatedLabelIds = new Map;
    #hidden;
    #max = 5;
    #min = 0;
    #outerContainer;
    #precision = 0;
    #resetHandler;
    #rtl = false;
    #stars = 5;
    #step = 1;
    #tabIndex;
    #tooltip;
    #tooltipTriggers = new Set;

    /**
     * Gets the number of decimal places represented by a finite number.
     * @param {number} value The number to inspect.
     * @returns {number} The number of decimal places.
     */
    static #getDecimalPlaces(value) {
        const [coefficient, exponent = 0] = `${value}`.toLowerCase().split('e');
        const decimals = (coefficient.split('.')[1] || '').length;

        return Math.max(0, decimals - Number(exponent));
    }

    /**
     * Parses a finite numeric value.
     * @param {*} value The value to parse.
     * @param {number} fallback The fallback value.
     * @returns {number} The parsed value or fallback.
     */
    static #parseNumber(value, fallback) {
        if (
            value === null ||
            value === undefined ||
            `${value}`.trim() === ''
        ) {
            return fallback;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : fallback;
    }

    /**
     * Creates a StarRating.
     * @param {HTMLInputElement} node The numeric input node.
     * @param {StarRatingOptions} [options] The StarRating options.
     */
    constructor(node, options) {
        super(node, options);

        this.#form = this.node.form;

        this.#normalizeOptions();
        this.#render();
        this.#refresh();
        this.#refreshDisabled();
        this.#events();

        if (this.options.tooltip) {
            this.#tooltipEvents();
        }
    }

    /**
     * Disables the StarRating.
     */
    disable() {
        $.setAttribute(this.node, { disabled: true });

        if (this.#dragging) {
            this.#resetState();
        }

        this.#refreshDisabled();
    }

    /** @inheritdoc */
    dispose() {
        this.#dragging = false;

        for (const [label, id] of this.#generatedLabelIds) {
            if ($.getAttribute(label, 'id') === id) {
                $.removeAttribute(label, 'id');
            }
        }

        if (this.#tooltip) {
            this.#tooltip.dispose();
        }

        $.remove(this.#outerContainer);
        $.removeEvent(this.node, 'change.ui.starrating');
        $.removeEvent(this.node, 'focus.ui.starrating');

        if (this.#form) {
            $.removeEvent(this.#form, 'reset.ui.starrating', this.#resetHandler);
        }

        if (this.#hidden) {
            $.addClass(this.node, this.constructor.classes.hide);
        } else {
            $.removeClass(this.node, this.constructor.classes.hide);
        }

        if (this.#tabIndex === null) {
            $.removeAttribute(this.node, 'tabindex');
        } else {
            $.setAttribute(this.node, { tabindex: this.#tabIndex });
        }

        this.#container = null;
        this.#filledContainer = null;
        this.#form = null;
        this.#generatedLabelIds = null;
        this.#outerContainer = null;
        this.#resetHandler = null;
        this.#tooltip = null;
        this.#tooltipTriggers = null;

        super.dispose();
    }

    /**
     * Enables the StarRating.
     */
    enable() {
        $.removeAttribute(this.node, 'disabled');
        this.#refreshDisabled();
    }

    /**
     * Gets the current rating.
     * @returns {number|null} The current rating, or `null` when the input is empty.
     */
    getValue() {
        const value = $.getValue(this.node);

        if (value === '') {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    }

    /**
     * Sets the current rating.
     * @param {number} value The rating to set.
     */
    setValue(value) {
        const normalizedValue = this.#normalizeValue(value);

        if (normalizedValue === null) {
            return;
        }

        this.#setDisplayedValue(normalizedValue);

        if (normalizedValue === this.getValue()) {
            return;
        }

        $.setValue(this.node, normalizedValue);
        $.triggerEvent(this.node, 'change.ui.starrating', {
            data: { skipUpdate: true },
        });
    }

    /**
     * Completes an active pointer drag.
     * @param {MouseEvent|TouchEvent} e The pointer end event.
     */
    #endDrag(e) {
        if (!this.node || !this.#dragging) {
            return;
        }

        const value = this.#getEventValue(e);

        if (value !== null) {
            this.setValue(value);
        } else {
            this.#refresh();
        }

        this.#dragging = false;
        this.#triggerTooltip('drag', false);

        // Force a redraw before restoring the configured transition.
        $.rect(this.#filledContainer);
        $.setStyle(this.#filledContainer, { transition: '' });
    }

    /**
     * Attaches input, keyboard, pointer, and hover events.
     */
    #events() {
        if (this.#form) {
            this.#resetHandler = (event) => {
                // Read the value after the browser completes its native reset.
                window.setTimeout(() => {
                    if (this.node && !event.defaultPrevented) {
                        this.#resetState();
                    }
                }, 0);
            };

            $.addEvent(this.#form, 'reset.ui.starrating', this.#resetHandler);
        }

        $.addEvent(this.node, 'focus.ui.starrating', (_) => {
            $.focus(this.#container);
        });

        $.addEvent(this.node, 'change.ui.starrating', (e) => {
            if (!e.skipUpdate) {
                this.#refresh();
            }
        });

        if (this.#displayOnly) {
            return;
        }

        $.addEvent(this.#container, 'keydown.ui.starrating', (e) => {
            if ($.is(this.node, ':disabled')) {
                return;
            }

            let value = this.getValue() ?? this.#min;
            const step = this.#step ?? 1;

            switch (e.code) {
                case 'ArrowLeft':
                    value += this.#rtl ? step : -step;
                    break;
                case 'ArrowDown':
                    value -= step;
                    break;
                case 'ArrowRight':
                    value += this.#rtl ? -step : step;
                    break;
                case 'ArrowUp':
                    value += step;
                    break;
                case 'End':
                    value = this.#max;
                    break;
                case 'Home':
                    value = this.#min;
                    break;
                case 'PageDown':
                    value--;
                    break;
                case 'PageUp':
                    value++;
                    break;
                default:
                    return;
            }

            e.preventDefault();
            this.setValue(value);
        });

        const dragEvent = $.mouseDragFactory(
            (e) => this.#startDrag(e),
            (e) => this.#moveDrag(e),
            (e) => this.#endDrag(e),
            {
                debounce: false,
                passive: false,
                preventDefault: false,
            },
        );

        $.addEvent(
            this.#container,
            'mousedown.ui.starrating touchstart.ui.starrating',
            dragEvent,
        );

        if (this.options.hover) {
            this.#hoverEvents();
        }
    }

    /**
     * Gets a normalized rating from a pointer event.
     * @param {MouseEvent|TouchEvent} e The pointer event.
     * @returns {number|null} The normalized rating, or `null` for invalid coordinates.
     */
    #getEventValue(e) {
        const { x } = getPosition(e);

        if (!Number.isFinite(x)) {
            return null;
        }

        let percentX = $.percentX(this.#container, x, { offset: true });

        if (!Number.isFinite(percentX)) {
            return null;
        }

        if (this.#rtl) {
            percentX = 100 - percentX;
        }

        return this.#normalizeValue(
            $._lerp(0, this.#stars, percentX / 100),
        );
    }

    /**
     * Gets the fill percentage for a rating.
     * @param {number|null} value The rating.
     * @returns {number} The fill percentage.
     */
    #getPercent(value) {
        value ??= this.#min;

        return $._clamp(
            $._inverseLerp(0, this.#stars, value) * 100,
            0,
            100,
        );
    }

    /**
     * Attaches pointer preview events.
     */
    #hoverEvents() {
        $.addEvent(this.#container, 'mousemove.ui.starrating', $.debounce((e) => {
            if (
                !this.node ||
                this.#dragging ||
                $.is(this.node, ':disabled')
            ) {
                return;
            }

            const value = this.#getEventValue(e);

            if (value === null) {
                return;
            }

            $.setStyle(this.#filledContainer, { transition: 'none' });
            this.#setDisplayedValue(value, { updateAria: false });

            // Force a redraw before restoring the configured transition.
            $.rect(this.#filledContainer);
            $.setStyle(this.#filledContainer, { transition: '' });
        }), { passive: true });

        $.addEvent(this.#container, 'mouseleave.ui.starrating', (_) => {
            if (
                !this.node ||
                this.#dragging ||
                $.is(this.node, ':disabled')
            ) {
                return;
            }

            this.#refresh();
        });
    }

    /**
     * Updates the rating during an active pointer drag.
     * @param {MouseEvent|TouchEvent} e The pointer move event.
     */
    #moveDrag(e) {
        if (!this.node || !this.#dragging) {
            return;
        }

        if (e.cancelable) {
            e.preventDefault();
        }

        const value = this.#getEventValue(e);

        if (value !== null) {
            this.setValue(value);
        }
    }

    /**
     * Normalizes native attributes and component options without mutating options.
     */
    #normalizeOptions() {
        const configuredStars = StarRating.#parseNumber(this.options.stars, 5);
        this.#stars = Math.max(1, Math.trunc(configuredStars));

        const minAttribute = $.getAttribute(this.node, 'min');
        const optionMin = StarRating.#parseNumber(this.options.min, 0);
        const configuredMin = StarRating.#parseNumber(minAttribute, optionMin);
        this.#min = $._clamp(
            configuredMin,
            0,
            this.#stars,
        );

        const maxAttribute = $.getAttribute(this.node, 'max');
        const optionMax = StarRating.#parseNumber(this.options.max, this.#stars);
        const configuredMax = StarRating.#parseNumber(maxAttribute, optionMax);
        this.#max = $._clamp(
            configuredMax,
            this.#min,
            this.#stars,
        );

        const stepAttribute = $.getAttribute(this.node, 'step');
        const step = StarRating.#parseNumber(stepAttribute ?? this.options.step, NaN);
        this.#step = step > 0 ? step : null;

        this.#precision = Math.max(
            StarRating.#getDecimalPlaces(this.#min),
            StarRating.#getDecimalPlaces(this.#max),
            this.#step === null ? 0 : StarRating.#getDecimalPlaces(this.#step),
        );
        this.#displayOnly = Boolean(
            this.options.displayOnly || $.getProperty(this.node, 'readOnly'),
        );
    }

    /**
     * Clamps and snaps a rating to the effective range and step.
     * @param {*} value The rating to normalize.
     * @returns {number|null} The normalized rating, or `null` for invalid input.
     */
    #normalizeValue(value) {
        value = StarRating.#parseNumber(value, NaN);

        if (!Number.isFinite(value)) {
            return null;
        }

        value = $._clamp(value, this.#min, this.#max);

        if (
            this.#step !== null &&
            value !== this.#min &&
            value !== this.#max
        ) {
            const steps = (value - this.#min) / this.#step;

            if (Number.isFinite(steps)) {
                const tolerance = Number.EPSILON * Math.max(1, Math.abs(steps));
                value = this.#min + (Math.ceil(steps - tolerance) * this.#step);
            }
        }

        if (this.#step !== null && this.#precision <= 100) {
            value = Number(value.toFixed(this.#precision));
        }

        return $._clamp(value, this.#min, this.#max);
    }

    /**
     * Renders and normalizes the current input value.
     */
    #refresh() {
        const value = this.getValue();
        const normalizedValue = value === null ? null : this.#normalizeValue(value);

        if (
            normalizedValue !== null &&
            normalizedValue !== value
        ) {
            $.setValue(this.node, normalizedValue);
        }

        this.#setDisplayedValue(normalizedValue);
    }

    /**
     * Synchronizes disabled styling and focusability with the input.
     */
    #refreshDisabled() {
        const disabled = $.is(this.node, ':disabled');

        if (disabled) {
            $.addClass(this.#container, this.constructor.classes.disabled);
        } else {
            $.removeClass(this.#container, this.constructor.classes.disabled);
        }

        $.setAttribute(this.#container, {
            'aria-disabled': disabled,
            'tabindex': disabled ? -1 : 0,
        });
    }

    /**
     * Renders the StarRating and records input and label attributes for disposal.
     */
    #render() {
        this.#hidden = $.hasClass(this.node, this.constructor.classes.hide);
        this.#tabIndex = $.getAttribute(this.node, 'tabindex');

        const labelledBy = new Set;
        const inputLabelledBy = $.getAttribute(this.node, 'aria-labelledby');

        if (inputLabelledBy) {
            for (const id of inputLabelledBy.split(/\s+/)) {
                if (id) {
                    labelledBy.add(id);
                }
            }
        }

        for (const label of this.node.labels || []) {
            let id = $.getAttribute(label, 'id');

            if (!id) {
                id = generateId('starrating-label');
                $.setAttribute(label, { id });
                this.#generatedLabelIds.set(label, id);
            }

            labelledBy.add(id);
        }

        const attributes = {
            'role': 'slider',
            'aria-valuemin': this.#min,
            'aria-valuemax': this.#max,
            'aria-valuenow': '',
            'aria-valuetext': '',
            'aria-required': Boolean($.getProperty(this.node, 'required')),
            'aria-readonly': this.#displayOnly,
        };
        const ariaLabel = $.getAttribute(this.node, 'aria-label');
        const direction = $.getAttribute(this.node, 'dir');

        if (labelledBy.size) {
            attributes['aria-labelledby'] = Array.from(labelledBy).join(' ');
        } else if (ariaLabel) {
            attributes['aria-label'] = ariaLabel;
        }

        if (direction) {
            attributes.dir = direction;
        }

        this.#outerContainer = $.create('div');

        if (this.options.animate) {
            $.addClass(this.#outerContainer, this.constructor.classes.animate);
        }

        this.#container = $.create('div', {
            class: [
                this.constructor.classes.container,
                `starrating-${this.options.size}`,
            ],
            attributes,
        });

        const outlineContainer = $.create('div', {
            class: this.constructor.classes.outline,
            html: this.constructor.icons.outline.repeat(this.#stars),
        });
        this.#filledContainer = $.create('div', {
            class: this.constructor.classes.filled,
            html: this.constructor.icons.filled.repeat(this.#stars),
        });

        $.append(this.#container, outlineContainer);
        $.append(this.#container, this.#filledContainer);
        $.append(this.#outerContainer, this.#container);

        $.addClass(this.node, this.constructor.classes.hide);
        $.setAttribute(this.node, { tabindex: -1 });
        $.before(this.node, this.#outerContainer);

        this.#rtl = $.css(this.#container, 'direction') === 'rtl';

        if (this.options.tooltip) {
            this.#tooltip = Tooltip.init(this.#container, {
                appendTo: 'body',
                placement: 'top',
                trigger: '',
            });
        }
    }

    /**
     * Restores the rendered value from the input and cancels an active drag.
     */
    #resetState() {
        this.#dragging = false;

        $.setStyle(this.#filledContainer, { transition: 'none' });
        this.#refresh();
        $.rect(this.#filledContainer);
        $.setStyle(this.#filledContainer, { transition: '' });

        this.#triggerTooltip('drag', false);
    }

    /**
     * Updates the rendered fill and accessible rating text.
     * @param {number|null} value The rating to render.
     * @param {object} [options] The update options.
     * @param {boolean} [options.updateAria=true] Whether to update slider ARIA values.
     */
    #setDisplayedValue(value, { updateAria = true } = {}) {
        $.setStyle(this.#filledContainer, {
            width: `${this.#getPercent(value)}%`,
        });

        value ??= this.#min;

        const ratingText = this.options.ratingText.call(this, value);

        if (updateAria) {
            $.setAttribute(this.#container, {
                'aria-valuenow': value,
                'aria-valuetext': ratingText,
            });
        }

        if (this.#tooltip) {
            $.setDataset(this.#container, { uiTitle: ratingText });
            this.#tooltip.refresh();
            this.#tooltip.update();
        }
    }

    /**
     * Starts a mouse or touch drag and sets the rating at the pointer position.
     * @param {MouseEvent|TouchEvent} e The pointer down event.
     * @returns {boolean|undefined} `false` when the drag must not start.
     */
    #startDrag(e) {
        if (
            !this.node ||
            (e.type === 'mousedown' && e.button !== 0) ||
            $.is(this.node, ':disabled')
        ) {
            return false;
        }

        const value = this.#getEventValue(e);

        if (value === null) {
            return false;
        }

        this.#dragging = true;
        $.focus(this.#container);
        $.setStyle(this.#filledContainer, { transition: 'none' });
        this.setValue(value);

        // A change handler may disable or dispose the control synchronously.
        if (!this.#dragging) {
            return false;
        }

        this.#triggerTooltip('drag');
    }

    /**
     * Attaches hover and focus tooltip events.
     */
    #tooltipEvents() {
        $.addEvent(this.#container, 'mouseenter.ui.starrating', (_) => {
            this.#triggerTooltip('hover');
        });

        $.addEvent(this.#container, 'mouseleave.ui.starrating', (_) => {
            this.#triggerTooltip('hover', false);
        });

        $.addEvent(this.#container, 'focus.ui.starrating', (_) => {
            this.#triggerTooltip('focus');
        });

        $.addEvent(this.#container, 'blur.ui.starrating', (_) => {
            this.#triggerTooltip('focus', false);
        });
    }

    /**
     * Shows or hides the tooltip for one interaction source.
     * @param {string} type The interaction source.
     * @param {boolean} [show=true] Whether the source is active.
     */
    #triggerTooltip(type, show = true) {
        if (!this.#tooltip) {
            return;
        }

        if (show) {
            if (!this.#tooltipTriggers.size) {
                this.#tooltip.show();
            }

            this.#tooltipTriggers.add(type);
            return;
        }

        this.#tooltipTriggers.delete(type);

        if (!this.#tooltipTriggers.size) {
            this.#tooltip.hide();
        }
    }
}
