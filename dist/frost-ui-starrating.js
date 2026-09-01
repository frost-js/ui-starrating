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

//#region src/js/star-rating.js
/**
	* StarRating Class
	* @class
	*/
	var StarRating = class extends _fr0st_ui.BaseComponent {
		/**
		* New StarRating constructor.
		* @param {HTMLElement} node The input node.
		* @param {object} [options] The options to create the StarRating with.
		*/
		constructor(node, options) {
			super(node, options);
			if (_fr0st_query.default.hasAttribute(this._node, "step")) this._options.step = _fr0st_query.default.getAttribute(this._node, "step");
			if (_fr0st_query.default.hasAttribute(this._node, "min")) this._options.min = _fr0st_query.default.getAttribute(this._node, "min");
			if (_fr0st_query.default.hasAttribute(this._node, "max")) this._options.max = _fr0st_query.default.getAttribute(this._node, "max");
			if (this._options.max === null) this._options.max = this._options.stars;
			if (_fr0st_query.default.getProperty(this._node, "readOnly")) this._options.displayOnly = true;
			if (this._options.step) this._stepLength = `${this._options.step}`.replace("d*.?/", "").length;
			const id = _fr0st_query.default.getAttribute(this._node, "id");
			this._label = _fr0st_query.default.findOne(`label[for="${id}"]`);
			if (this._label && !_fr0st_query.default.getAttribute(this._label, "id")) {
				_fr0st_query.default.setAttribute(this._label, { id: (0, _fr0st_ui.generateId)("starrating-label") });
				this._labelId = true;
			}
			this._render();
			this._refresh();
			if (!this._options.displayOnly) this._events();
			if (this._options.tooltip) this._tooltipEvents();
			this._refreshDisabled();
		}
		/**
		* Disable the StarRating.
		*/
		disable() {
			_fr0st_query.default.setAttribute(this._node, { disabled: true });
			this._refreshDisabled();
		}
		/**
		* Dispose the StarRating.
		*/
		dispose() {
			if (this._labelId) _fr0st_query.default.removeAttribute(this._label, "id");
			if (this._tooltip) {
				this._tooltip.dispose();
				this._tooltip = null;
			}
			_fr0st_query.default.remove(this._outerContainer);
			_fr0st_query.default.removeAttribute(this._node, "tabindex");
			_fr0st_query.default.removeEvent(this._node, "focus.ui.starrating");
			_fr0st_query.default.removeClass(this._node, this.constructor.classes.hide);
			this._label = null;
			this._outerContainer = null;
			this._container = null;
			this._filledContainer = null;
			super.dispose();
		}
		/**
		* Enable the StarRating.
		*/
		enable() {
			_fr0st_query.default.removeAttribute(this._node, "disabled");
			this._refreshDisabled();
		}
		/**
		* Get the current value.
		* @return {number} The current value.
		*/
		getValue() {
			const value = _fr0st_query.default.getValue(this._node);
			return value !== "" ? parseFloat(value) : null;
		}
		/**
		* Set the current value.
		* @param {number} value The value to set.
		*/
		setValue(value) {
			value = parseFloat(value);
			value = this._clampValue(value);
			if (value === this.getValue()) return;
			const percent = this._getPercent(value);
			_fr0st_query.default.setStyle(this._filledContainer, { width: `${percent}%` });
			this._updateValue(value);
			_fr0st_query.default.setValue(this._node, value);
			_fr0st_query.default.triggerEvent(this._node, "change.ui.starrating");
		}
	};

//#endregion
//#region src/js/prototype/events.js
/**
	* Attach events for the StarRating.
	*/
	function _events() {
		_fr0st_query.default.addEvent(this._node, "focus.ui.starrating", (_) => {
			_fr0st_query.default.focus(this._container);
		});
		const downEvent = (e) => {
			if (e.button || _fr0st_query.default.is(this._node, ":disabled")) return false;
			_fr0st_query.default.setStyle(this._filledContainer, { transition: "none" });
			const pos = (0, _fr0st_ui.getPosition)(e);
			const percentX = _fr0st_query.default.percentX(this._container, pos.x, { offset: true });
			const value = this._getValue(percentX);
			this.setValue(value);
			_fr0st_query.default.setDataset(this._container, { uiDragging: true });
			if (this._options.tooltip) this._triggerTooltip("drag");
		};
		const moveEvent = (e) => {
			const pos = (0, _fr0st_ui.getPosition)(e);
			const percentX = _fr0st_query.default.percentX(this._container, pos.x, { offset: true });
			const value = this._getValue(percentX);
			this.setValue(value);
		};
		const upEvent = (e) => {
			_fr0st_query.default.removeDataset(this._container, "uiDragging");
			if (this._options.tooltip) this._triggerTooltip("drag", false);
			const pos = (0, _fr0st_ui.getPosition)(e);
			const percentX = _fr0st_query.default.percentX(this._container, pos.x, { offset: true });
			const value = this._getValue(percentX);
			if (value === this.getValue()) this._updateValue(value);
			else this.setValue(value);
			_fr0st_query.default.rect(this._filledContainer);
			_fr0st_query.default.setStyle(this._filledContainer, { transition: "" });
		};
		const dragEvent = _fr0st_query.default.mouseDragFactory(downEvent, moveEvent, upEvent, { preventDefault: false });
		_fr0st_query.default.addEvent(this._container, "mousedown.ui.starrating touchstart.ui.starrating", dragEvent);
		_fr0st_query.default.addEvent(this._container, "keydown.ui.starrating", (e) => {
			let value = this.getValue();
			if (value === null) value = this._options.min;
			switch (e.code) {
				case "ArrowLeft":
				case "ArrowDown":
					value -= this._options.step;
					break;
				case "ArrowRight":
				case "ArrowUp":
					value += this._options.step;
					break;
				case "End":
					value = this._options.max;
					break;
				case "Home":
					value = this._options.min;
					break;
				case "PageDown":
					value--;
					break;
				case "PageUp":
					value++;
					break;
				default: return;
			}
			this.setValue(value);
		});
		if (this._options.hover) this._hoverEvents();
	}
	/**
	* Attach hover events for the StarRating.
	*/
	function _hoverEvents() {
		_fr0st_query.default.addEvent(this._container, "mousemove.ui.starrating", _fr0st_query.default.debounce((e) => {
			if (_fr0st_query.default.is(this._node, ":disabled") || _fr0st_query.default.getDataset(this._container, "uiDragging")) return;
			const percentX = _fr0st_query.default.percentX(this._container, e.pageX, { offset: true });
			const value = this._getValue(percentX);
			const percent = this._getPercent(value);
			_fr0st_query.default.setStyle(this._filledContainer, { transition: "none" });
			_fr0st_query.default.setStyle(this._filledContainer, { width: `${percent}%` });
			_fr0st_query.default.rect(this._filledContainer);
			_fr0st_query.default.setStyle(this._filledContainer, { transition: "" });
			this._updateValue(value, { updateAria: false });
		}), { passive: true });
		_fr0st_query.default.addEvent(this._container, "mouseleave.ui.starrating", (_) => {
			if (_fr0st_query.default.is(this._node, ":disabled") || _fr0st_query.default.getDataset(this._container, "uiDragging")) return;
			this._refresh();
		});
	}
	/**
	* Attach events for the StarRating tooltip.
	*/
	function _tooltipEvents() {
		const tooltipTriggers = {};
		this._triggerTooltip = _fr0st_query.default._debounce((type, show = true) => {
			if (show) {
				if (!Object.keys(tooltipTriggers).length) {
					this._tooltip._stop();
					this._tooltip.show();
				}
				tooltipTriggers[type] = true;
			} else {
				delete tooltipTriggers[type];
				if (!Object.keys(tooltipTriggers).length) {
					this._tooltip._stop();
					this._tooltip.hide();
				}
			}
		});
		_fr0st_query.default.addEvent(this._container, "mouseenter.ui.starrating", (e) => {
			if (!_fr0st_query.default.isSame(e.target, this._container)) return;
			this._triggerTooltip("hover");
		});
		_fr0st_query.default.addEvent(this._container, "mouseleave.ui.starrating", (e) => {
			if (!_fr0st_query.default.isSame(e.target, this._container)) return;
			this._triggerTooltip("hover", false);
		});
	}

//#endregion
//#region src/js/prototype/helpers.js
/**
	* Clamp a value to a step-size, and between a min and max value.
	* @param {number} value The value to clamp.
	* @return {number} The clamped value.
	*/
	function _clampValue(value) {
		if (this._options.step) {
			value /= this._options.step;
			value = value < 1 ? Math.round(value) : Math.ceil(value);
			value *= this._options.step;
			value = value.toFixed(this._stepLength);
		}
		return _fr0st_query.default._clamp(value, this._options.min, this._options.max);
	}
	/**
	* Get the percent from a value.
	* @param {number} value The value.
	* @return {number} The percent.
	*/
	function _getPercent(value) {
		return _fr0st_query.default._inverseLerp(0, this._options.stars, value) * 100;
	}
	/**
	* Get the value from an X percent.
	* @param {number} percentX The X percent.
	* @return {number} The value.
	*/
	function _getValue(percentX) {
		const value = _fr0st_query.default._lerp(0, this._options.stars, percentX / 100);
		return this._clampValue(value);
	}
	/**
	* Refresh the star rating.
	*/
	function _refresh() {
		const value = this.getValue();
		const percent = this._getPercent(value);
		_fr0st_query.default.setStyle(this._filledContainer, { width: `${percent}%` });
		this._updateValue(value);
	}
	/**
	* Refresh the disabled styling.
	*/
	function _refreshDisabled() {
		const disabled = _fr0st_query.default.is(this._node, ":disabled");
		if (disabled) _fr0st_query.default.addClass(this._container, this.constructor.classes.disabled);
		else _fr0st_query.default.removeClass(this._container, this.constructor.classes.disabled);
		_fr0st_query.default.setAttribute(this._container, {
			"aria-disabled": disabled,
			"tabindex": disabled ? -1 : 0
		});
	}
	/**
	* Update the value.
	* @param {number} value The value.
	* @param {object} [options] The options for updating the value.
	*/
	function _updateValue(value, { updateAria = true, updateTooltip = true } = {}) {
		if (value === null) value = this._options.min;
		const ratingText = this._options.ratingText.bind(this)(value);
		if (updateAria) _fr0st_query.default.setAttribute(this._container, {
			"aria-valuenow": value,
			"aria-valuetext": ratingText
		});
		if (updateTooltip && this._tooltip) {
			_fr0st_query.default.setDataset(this._container, { uiTitle: ratingText });
			this._tooltip.refresh();
			this._tooltip.update();
		}
	}

//#endregion
//#region src/js/prototype/render.js
/**
	* Render the star rating.
	*/
	function _render() {
		this._outerContainer = _fr0st_query.default.create("div");
		if (this._options.animate) _fr0st_query.default.addClass(this._outerContainer, this.constructor.classes.animate);
		this._container = _fr0st_query.default.create("div", {
			class: [this.constructor.classes.container, `starrating-${this._options.size}`],
			attributes: {
				"role": "slider",
				"aria-valuemin": this._options.min,
				"aria-valuemax": this._options.max,
				"aria-valuenow": "",
				"aria-valuetext": "",
				"aria-required": _fr0st_query.default.getProperty(this._node, "required")
			}
		});
		if (this._label) {
			const labelId = _fr0st_query.default.getAttribute(this._label, "id");
			_fr0st_query.default.setAttribute(this._container, { "aria-labelledby": labelId });
		}
		const outline = [];
		const filled = [];
		for (let i = 0; i < this._options.stars; i++) {
			outline.push(this.constructor.icons.outline);
			filled.push(this.constructor.icons.filled);
		}
		const outlineContainer = _fr0st_query.default.create("div", {
			class: this.constructor.classes.outline,
			html: outline.join("")
		});
		this._filledContainer = _fr0st_query.default.create("div", {
			class: this.constructor.classes.filled,
			html: filled.join("")
		});
		_fr0st_query.default.append(this._container, outlineContainer);
		_fr0st_query.default.append(this._container, this._filledContainer);
		_fr0st_query.default.append(this._outerContainer, this._container);
		_fr0st_query.default.addClass(this._node, this.constructor.classes.hide);
		_fr0st_query.default.setAttribute(this._node, { tabindex: -1 });
		_fr0st_query.default.before(this._node, this._outerContainer);
		if (this._options.tooltip) this._tooltip = _fr0st_ui.Tooltip.init(this._container, {
			appendTo: "body",
			trigger: "",
			placement: "top"
		});
	}

//#endregion
//#region src/js/index.js
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
	var proto = StarRating.prototype;
	proto._clampValue = _clampValue;
	proto._events = _events;
	proto._getPercent = _getPercent;
	proto._getValue = _getValue;
	proto._hoverEvents = _hoverEvents;
	proto._refresh = _refresh;
	proto._refreshDisabled = _refreshDisabled;
	proto._render = _render;
	proto._tooltipEvents = _tooltipEvents;
	proto._updateValue = _updateValue;
	(0, _fr0st_ui.initComponent)("starrating", StarRating);
	var js_default = StarRating;

//#endregion
exports.StarRating = js_default;
});
//# sourceMappingURL=frost-ui-starrating.js.map