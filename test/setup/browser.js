/** @import { Page } from '@playwright/test'; */

/**
 * Resets the browser page and StarRating configuration.
 * @param {Page} page The Playwright page.
 * @returns {Promise<void>} The promise.
 */
export async function resetPage(page) {
    await page.goto('/', {
        waitUntil: 'domcontentloaded',
    });

    const stateReset = await page.evaluate((_) => {
        if (!window.fQuery || !window.UI?.StarRating) {
            return false;
        }

        window.$ = window.fQuery;

        UI.StarRating.defaults.animate = true;
        UI.StarRating.defaults.displayOnly = false;
        UI.StarRating.defaults.hover = true;
        UI.StarRating.defaults.max = null;
        UI.StarRating.defaults.min = 0;
        UI.StarRating.defaults.ratingText = function(rating) {
            return rating === 1 ?
                `${rating} ${this.constructor.lang.star}` :
                `${rating} ${this.constructor.lang.stars}`;
        };
        UI.StarRating.defaults.size = 'md';
        UI.StarRating.defaults.stars = 5;
        UI.StarRating.defaults.step = 1;
        UI.StarRating.defaults.tooltip = true;

        UI.StarRating.classes.animate = 'starrating-animate';
        UI.StarRating.classes.container = 'starrating';
        UI.StarRating.classes.disabled = 'starrating-disabled';
        UI.StarRating.classes.filled = 'starrating-filled';
        UI.StarRating.classes.hide = 'visually-hidden';
        UI.StarRating.classes.outline = 'starrating-outline';

        UI.StarRating.lang.star = 'star';
        UI.StarRating.lang.stars = 'stars';

        $.empty(document.body);

        return window.$ === window.fQuery &&
            typeof $.QuerySet.prototype.starrating === 'function';
    });

    if (!stateReset) {
        throw new Error('Failed to restore StarRating on the test page.');
    }

    await page.waitForFunction((_) => {
        const rating = $.create('div', { class: 'starrating' });
        const filled = $.create('div', { class: 'starrating-filled' });
        $.append(rating, filled);
        $.append(document.body, rating);
        const ready = $.css(rating, 'position') === 'relative' &&
            $.css(filled, 'position') === 'absolute';
        $.remove(rating);
        return ready;
    });
}
