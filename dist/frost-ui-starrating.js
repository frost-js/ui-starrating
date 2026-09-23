(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ?  factory(exports, require('@fr0st/ui'), require('@fr0st/query')) :
  typeof define === 'function' && define.amd ? define(['exports', '@fr0st/ui', '@fr0st/query'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.UI = global.UI || {}), global.UI,global.fQuery));
})(this, function(exports, _fr0st_ui, _fr0st_query) {
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) {
					__defProp(to, key, {
						get: ((k) => from[k]).bind(null, key),
						enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
					});
				}
			}
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));

//#endregion
_fr0st_query = __toESM(_fr0st_query, 1);

//#region src/js/helpers.js
/**
	* Gets the number of decimal places represented by a finite number.
	* @param {number} value The number to inspect.
	* @returns {number} The number of decimal places.
	*/
	function getDecimalPlaces(value) {
		const [coefficient, exponent = 0] = `${value}`.toLowerCase().split("e");
		const decimals = (coefficient.split(".")[1] || "").length;
		return Math.max(0, decimals - Number(exponent));
	}
	/**
	* Parses a finite numeric value.
	* @param {*} value The value to parse.
	* @param {number} fallback The fallback value.
	* @returns {number} The parsed value or fallback.
	*/
	function parseNumber(value, fallback) {
		if (value === null || value === void 0 || `${value}`.trim() === "") return fallback;
		const number = Number(value);
		return Number.isFinite(number) ? number : fallback;
	}

//#endregion
//#region src/js/star-rating.js
	var window = _fr0st_query.default.getWindow();
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
	var StarRating = class extends _fr0st_ui.BaseComponent {
		#container;
		#displayOnly = false;
		#dragging = false;
		#filledContainer;
		#form;
		#generatedLabelIds = /* @__PURE__ */ new Map();
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
		#tooltipTriggers = /* @__PURE__ */ new Set();
		/**
		* Creates a StarRating.
		* @param {HTMLInputElement} node The numeric input node.
		* @param {StarRatingOptions} [options] The StarRating options.
		*/
		constructor(node, options) {
			super(node, options);
			this.#form = this.node.form;
			const configuredStars = parseNumber(this.options.stars, 5);
			this.#stars = Math.max(1, Math.trunc(configuredStars));
			const minAttribute = _fr0st_query.default.getAttribute(this.node, "min");
			const optionMin = parseNumber(this.options.min, 0);
			const configuredMin = parseNumber(minAttribute, optionMin);
			this.#min = _fr0st_query.default._clamp(configuredMin, 0, this.#stars);
			const maxAttribute = _fr0st_query.default.getAttribute(this.node, "max");
			const optionMax = parseNumber(this.options.max, this.#stars);
			const configuredMax = parseNumber(maxAttribute, optionMax);
			this.#max = _fr0st_query.default._clamp(configuredMax, this.#min, this.#stars);
			const stepAttribute = _fr0st_query.default.getAttribute(this.node, "step");
			const step = parseNumber(stepAttribute ?? this.options.step, NaN);
			this.#step = step > 0 ? step : null;
			this.#precision = Math.max(getDecimalPlaces(this.#min), getDecimalPlaces(this.#max), this.#step === null ? 0 : getDecimalPlaces(this.#step));
			this.#displayOnly = Boolean(this.options.displayOnly || _fr0st_query.default.getProperty(this.node, "readOnly"));
			this.#render();
			this.#refresh();
			this.#refreshDisabled();
			this.#events();
		}
		/**
		* Disables the StarRating.
		*/
		disable() {
			_fr0st_query.default.setAttribute(this.node, { disabled: true });
			this.#resetState();
			this.#refreshDisabled();
		}
		/** @inheritdoc */
		dispose() {
			this.#dragging = false;
			for (const [label, id] of this.#generatedLabelIds) if (_fr0st_query.default.getAttribute(label, "id") === id) _fr0st_query.default.removeAttribute(label, "id");
			if (this.#tooltip) this.#tooltip.dispose();
			_fr0st_query.default.remove(this.#outerContainer);
			_fr0st_query.default.removeEvent(this.node, "change.ui.starrating");
			_fr0st_query.default.removeEvent(this.node, "focus.ui.starrating");
			if (this.#form) _fr0st_query.default.removeEvent(this.#form, "reset.ui.starrating", this.#resetHandler);
			if (this.#hidden) _fr0st_query.default.addClass(this.node, this.constructor.classes.hide);
			else _fr0st_query.default.removeClass(this.node, this.constructor.classes.hide);
			if (this.#tabIndex === null) _fr0st_query.default.removeAttribute(this.node, "tabindex");
			else _fr0st_query.default.setAttribute(this.node, { tabindex: this.#tabIndex });
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
			_fr0st_query.default.removeAttribute(this.node, "disabled");
			this.#refreshDisabled();
		}
		/**
		* Gets the current rating.
		* @returns {number|null} The current rating, or `null` when the input is empty.
		*/
		getValue() {
			const value = _fr0st_query.default.getValue(this.node);
			if (value === "") return null;
			const number = Number(value);
			return Number.isFinite(number) ? number : null;
		}
		/**
		* Sets the current rating.
		* @param {number} value The rating to set.
		*/
		setValue(value) {
			const normalizedValue = this.#normalizeValue(value);
			if (normalizedValue === null) return;
			this.#setDisplayedValue(normalizedValue);
			if (normalizedValue === this.getValue()) return;
			_fr0st_query.default.setValue(this.node, normalizedValue);
			_fr0st_query.default.triggerEvent(this.node, "change.ui.starrating", { data: { skipUpdate: true } });
		}
		/**
		* Attaches input, keyboard, pointer, hover, and tooltip events.
		*/
		#events() {
			if (this.#form) {
				this.#resetHandler = (event) => {
					window.setTimeout(() => {
						if (this.node && !event.defaultPrevented) this.#resetState();
					}, 0);
				};
				_fr0st_query.default.addEvent(this.#form, "reset.ui.starrating", this.#resetHandler);
			}
			_fr0st_query.default.addEvent(this.node, "focus.ui.starrating", (_) => {
				_fr0st_query.default.focus(this.#container);
			});
			_fr0st_query.default.addEvent(this.node, "change.ui.starrating", (e) => {
				if (!e.skipUpdate) this.#refresh();
			});
			if (this.options.tooltip) {
				_fr0st_query.default.addEvent(this.#container, "mouseenter.ui.starrating", (_) => {
					this.#triggerTooltip("hover");
				});
				_fr0st_query.default.addEvent(this.#container, "mouseleave.ui.starrating", (_) => {
					this.#triggerTooltip("hover", false);
				});
				_fr0st_query.default.addEvent(this.#container, "focus.ui.starrating", (_) => {
					this.#triggerTooltip("focus");
				});
				_fr0st_query.default.addEvent(this.#container, "blur.ui.starrating", (_) => {
					this.#triggerTooltip("focus", false);
				});
			}
			if (this.#displayOnly) return;
			_fr0st_query.default.addEvent(this.#container, "keydown.ui.starrating", (e) => {
				if (_fr0st_query.default.is(this.node, ":disabled")) return;
				let value = this.getValue() ?? this.#min;
				const step = this.#step ?? 1;
				switch (e.code) {
					case "ArrowLeft":
						value += this.#rtl ? step : -step;
						break;
					case "ArrowDown":
						value -= step;
						break;
					case "ArrowRight":
						value += this.#rtl ? -step : step;
						break;
					case "ArrowUp":
						value += step;
						break;
					case "End":
						value = this.#max;
						break;
					case "Home":
						value = this.#min;
						break;
					case "PageDown":
						value -= Math.max(1, step);
						break;
					case "PageUp":
						value += Math.max(1, step);
						break;
					default: return;
				}
				e.preventDefault();
				this.setValue(value);
			});
			const dragEvent = _fr0st_query.default.mouseDragFactory((e) => {
				if (!this.node || e.type === "mousedown" && e.button !== 0 || _fr0st_query.default.is(this.node, ":disabled")) return false;
				const value = this.#getEventValue(e);
				if (value === null) return false;
				this.#dragging = true;
				_fr0st_query.default.focus(this.#container);
				if (!this.#dragging) return false;
				_fr0st_query.default.setStyle(this.#filledContainer, { transition: "none" });
				this.setValue(value);
				if (!this.#dragging) return false;
				this.#triggerTooltip("drag");
			}, (e) => {
				if (!this.node || !this.#dragging) return;
				if (e.cancelable) e.preventDefault();
				const value = this.#getEventValue(e);
				if (value !== null) this.setValue(value);
			}, (e) => {
				if (!this.node || !this.#dragging) return;
				const value = this.#getEventValue(e);
				if (value !== null) this.setValue(value);
				else this.#refresh();
				this.#dragging = false;
				this.#triggerTooltip("drag", false);
				_fr0st_query.default.rect(this.#filledContainer);
				_fr0st_query.default.setStyle(this.#filledContainer, { transition: "" });
			}, {
				debounce: false,
				passive: false,
				preventDefault: false
			});
			_fr0st_query.default.addEvent(this.#container, "mousedown.ui.starrating touchstart.ui.starrating", dragEvent);
			if (this.options.hover) {
				_fr0st_query.default.addEvent(this.#container, "mousemove.ui.starrating", _fr0st_query.default.debounce((e) => {
					if (!this.node || this.#dragging || _fr0st_query.default.is(this.node, ":disabled")) return;
					const value = this.#getEventValue(e);
					if (value === null) return;
					_fr0st_query.default.setStyle(this.#filledContainer, { transition: "none" });
					this.#setDisplayedValue(value, { updateAria: false });
					_fr0st_query.default.rect(this.#filledContainer);
					_fr0st_query.default.setStyle(this.#filledContainer, { transition: "" });
				}), { passive: true });
				_fr0st_query.default.addEvent(this.#container, "mouseleave.ui.starrating", (_) => {
					if (!this.node || this.#dragging || _fr0st_query.default.is(this.node, ":disabled")) return;
					this.#refresh();
				});
			}
		}
		/**
		* Gets a normalized rating from a pointer event.
		* @param {MouseEvent|TouchEvent} e The pointer event.
		* @returns {number|null} The normalized rating, or `null` for invalid coordinates.
		*/
		#getEventValue(e) {
			const { x } = (0, _fr0st_ui.getPosition)(e);
			if (!Number.isFinite(x)) return null;
			let percentX = _fr0st_query.default.percentX(this.#container, x, { offset: true });
			if (!Number.isFinite(percentX)) return null;
			if (this.#rtl) percentX = 100 - percentX;
			return this.#normalizeValue(_fr0st_query.default._lerp(0, this.#stars, percentX / 100));
		}
		/**
		* Clamps and snaps a rating to the effective range and step.
		* @param {*} value The rating to normalize.
		* @returns {number|null} The normalized rating, or `null` for invalid input.
		*/
		#normalizeValue(value) {
			value = parseNumber(value, NaN);
			if (!Number.isFinite(value)) return null;
			value = _fr0st_query.default._clamp(value, this.#min, this.#max);
			if (this.#step !== null && value !== this.#min && value !== this.#max) {
				const steps = (value - this.#min) / this.#step;
				const tolerance = Number.EPSILON * Math.max(1, Math.abs(steps));
				if (tolerance < .5) value = this.#min + Math.ceil(steps - tolerance) * this.#step;
			}
			if (this.#step !== null && this.#precision <= 100) value = Number(value.toFixed(this.#precision));
			return _fr0st_query.default._clamp(value, this.#min, this.#max);
		}
		/**
		* Renders and normalizes the current input value.
		*/
		#refresh() {
			const value = this.getValue();
			const normalizedValue = value === null ? null : this.#normalizeValue(value);
			if (normalizedValue !== null && normalizedValue !== value) _fr0st_query.default.setValue(this.node, normalizedValue);
			this.#setDisplayedValue(normalizedValue);
		}
		/**
		* Synchronizes disabled styling and focusability with the input.
		*/
		#refreshDisabled() {
			const disabled = _fr0st_query.default.is(this.node, ":disabled");
			if (disabled) _fr0st_query.default.addClass(this.#container, this.constructor.classes.disabled);
			else _fr0st_query.default.removeClass(this.#container, this.constructor.classes.disabled);
			_fr0st_query.default.setAttribute(this.#container, {
				"aria-disabled": disabled,
				"tabindex": disabled ? -1 : 0
			});
		}
		/**
		* Renders the StarRating and records input and label attributes for disposal.
		*/
		#render() {
			this.#hidden = _fr0st_query.default.hasClass(this.node, this.constructor.classes.hide);
			this.#tabIndex = _fr0st_query.default.getAttribute(this.node, "tabindex");
			const labelledBy = /* @__PURE__ */ new Set();
			const inputLabelledBy = _fr0st_query.default.getAttribute(this.node, "aria-labelledby");
			if (inputLabelledBy) {
				for (const id of inputLabelledBy.split(/\s+/)) if (id) labelledBy.add(id);
			}
			for (const label of this.node.labels || []) {
				let id = _fr0st_query.default.getAttribute(label, "id");
				if (!id) {
					id = (0, _fr0st_ui.generateId)("starrating-label");
					_fr0st_query.default.setAttribute(label, { id });
					this.#generatedLabelIds.set(label, id);
				}
				labelledBy.add(id);
			}
			const attributes = {
				"role": "slider",
				"aria-valuemin": this.#min,
				"aria-valuemax": this.#max,
				"aria-valuenow": "",
				"aria-valuetext": "",
				"aria-required": Boolean(_fr0st_query.default.getProperty(this.node, "required")),
				"aria-readonly": this.#displayOnly
			};
			const ariaLabel = _fr0st_query.default.getAttribute(this.node, "aria-label");
			const direction = _fr0st_query.default.getAttribute(this.node, "dir");
			if (labelledBy.size) attributes["aria-labelledby"] = Array.from(labelledBy).join(" ");
			else if (ariaLabel) attributes["aria-label"] = ariaLabel;
			if (direction) attributes.dir = direction;
			this.#outerContainer = _fr0st_query.default.create("div");
			if (this.options.animate) _fr0st_query.default.addClass(this.#outerContainer, this.constructor.classes.animate);
			this.#container = _fr0st_query.default.create("div", {
				class: [this.constructor.classes.container, `starrating-${this.options.size}`],
				attributes
			});
			const outlineContainer = _fr0st_query.default.create("div", {
				class: this.constructor.classes.outline,
				html: this.constructor.icons.outline.repeat(this.#stars)
			});
			this.#filledContainer = _fr0st_query.default.create("div", {
				class: this.constructor.classes.filled,
				html: this.constructor.icons.filled.repeat(this.#stars)
			});
			_fr0st_query.default.append(this.#container, outlineContainer);
			_fr0st_query.default.append(this.#container, this.#filledContainer);
			_fr0st_query.default.append(this.#outerContainer, this.#container);
			_fr0st_query.default.addClass(this.node, this.constructor.classes.hide);
			_fr0st_query.default.setAttribute(this.node, { tabindex: -1 });
			_fr0st_query.default.before(this.node, this.#outerContainer);
			this.#rtl = _fr0st_query.default.css(this.#container, "direction") === "rtl";
			if (this.options.tooltip) this.#tooltip = _fr0st_ui.Tooltip.init(this.#container, {
				appendTo: "body",
				placement: "top",
				trigger: ""
			});
		}
		/**
		* Restores the rendered value from the input and cancels an active drag.
		*/
		#resetState() {
			this.#dragging = false;
			_fr0st_query.default.setStyle(this.#filledContainer, { transition: "none" });
			this.#refresh();
			_fr0st_query.default.rect(this.#filledContainer);
			_fr0st_query.default.setStyle(this.#filledContainer, { transition: "" });
			this.#triggerTooltip("drag", false);
		}
		/**
		* Updates the rendered fill and accessible rating text.
		* @param {number|null} value The rating to render.
		* @param {object} [options] The update options.
		* @param {boolean} [options.updateAria=true] Whether to update slider ARIA values.
		*/
		#setDisplayedValue(value, { updateAria = true } = {}) {
			value ??= this.#min;
			_fr0st_query.default.setStyle(this.#filledContainer, { width: `${_fr0st_query.default._clamp(value / this.#stars * 100, 0, 100)}%` });
			const ratingText = this.options.ratingText.call(this, value);
			if (updateAria) _fr0st_query.default.setAttribute(this.#container, {
				"aria-valuenow": value,
				"aria-valuetext": ratingText
			});
			if (this.#tooltip) {
				_fr0st_query.default.setDataset(this.#container, { uiTitle: ratingText });
				this.#tooltip.refresh();
				this.#tooltip.update();
			}
		}
		/**
		* Shows or hides the tooltip for one interaction source.
		* @param {string} type The interaction source.
		* @param {boolean} [show=true] Whether the source is active.
		*/
		#triggerTooltip(type, show = true) {
			if (!this.#tooltip) return;
			if (show) {
				if (!this.#tooltipTriggers.size) this.#tooltip.show();
				this.#tooltipTriggers.add(type);
				return;
			}
			this.#tooltipTriggers.delete(type);
			if (!this.#tooltipTriggers.size) this.#tooltip.hide();
		}
	};

//#endregion
//#region src/js/index.js
/** @import { StarRatingOptions } from './star-rating.js'; */
	/** @type {StarRatingOptions} */
	StarRating.defaults = {
		size: "md",
		min: 0,
		max: null,
		step: 1,
		stars: 5,
		ratingText(rating) {
			return rating === 1 ? `${rating} ${this.constructor.lang.star}` : `${rating} ${this.constructor.lang.stars}`;
		},
		tooltip: true,
		hover: true,
		animate: true,
		displayOnly: false
	};
	StarRating.classes = {
		animate: "starrating-animate",
		container: "starrating",
		disabled: "starrating-disabled",
		filled: "starrating-filled",
		hide: "visually-hidden",
		outline: "starrating-outline"
	};
	StarRating.icons = {
		filled: "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" aria-hidden=\"true\" focusable=\"false\" width=\"1em\" height=\"1em\" preserveAspectRatio=\"xMidYMid meet\" viewBox=\"0 0 24 24\"><path d=\"M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2L9.19 8.62L2 9.24l5.45 4.73L5.82 21L12 17.27z\" fill=\"currentColor\"/></svg>",
		outline: "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" aria-hidden=\"true\" focusable=\"false\" width=\"1em\" height=\"1em\" preserveAspectRatio=\"xMidYMid meet\" viewBox=\"0 0 24 24\"><path d=\"M12 15.39l-3.76 2.27l.99-4.28l-3.32-2.88l4.38-.37L12 6.09l1.71 4.04l4.38.37l-3.32 2.88l.99 4.28M22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.45 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24z\" fill=\"currentColor\"/></svg>"
	};
	StarRating.lang = {
		star: "star",
		stars: "stars"
	};
	(0, _fr0st_ui.initComponent)("starrating", StarRating);
	var js_default = StarRating;

//#endregion
exports.StarRating = js_default;
});
//# sourceMappingURL=frost-ui-starrating.js.map