import { expect, test } from '#test';
import { dispatchDragEvent } from '../setup/drag.js';

test.use({ mockClock: true });

test.beforeEach(async ({ page }) => {
    await page.evaluate((_) => {
        $.setHtml(document.body, '<form id="form"><input id="rating" type="number" step="0.5" value="2"></form><button id="other">Other</button>');
        UI.StarRating.init($.findOne('#rating'), { tooltip: false });
    });
});

test.describe('StarRating form resets', () => {
    for (const value of ['', '2.5']) {
        test(`restores the ${value || 'empty'} default without emitting change`, async ({ page }) => {
            await page.evaluate((value) => {
                const input = $.findOne('#rating');
                input.defaultValue = value;
                $.getData(input, 'starrating').setValue(4);
                window.resetChanges = 0;
                $.addEvent(input, 'change.ui.starrating', (_) => window.resetChanges++);
                input.form.reset();
            }, value);
            await page.clock.runFor(1);

            await expect(page.locator('#rating')).toHaveValue(value);
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', value || '0');
            expect(await page.locator('.starrating-filled').evaluate((node) => node.style.width))
                .toBe(value ? '50%' : '0%');
            expect(await page.evaluate((_) => window.resetChanges)).toBe(0);

            await page.locator('.starrating').press('ArrowUp');
            await expect(page.locator('#rating')).toHaveValue(value ? '3' : '0.5');
            expect(await page.evaluate((_) => window.resetChanges)).toBe(1);
        });
    }

    test('handles an input associated with an external form', async ({ page }) => {
        await page.evaluate((_) => {
            $.append(document.body, '<input id="external" type="number" form="form" value="3">');
            UI.StarRating.init($.findOne('#external'), { tooltip: false }).setValue(5);
            $.findOne('#form').reset();
        });
        await page.clock.runFor(1);

        await expect(page.locator('#external')).toHaveValue('3');
        await expect(page.locator('.starrating').last()).toHaveAttribute('aria-valuenow', '3');
    });

    test('refreshes read-only ratings and tooltip text', async ({ page }) => {
        await page.evaluate((_) => {
            const input = $.findOne('#rating');
            $.getData(input, 'starrating').dispose();
            input.readOnly = true;
            UI.StarRating.init(input).setValue(4);
            input.form.reset();
        });
        await page.clock.runFor(1);

        await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2');
        await expect(page.locator('.starrating')).toHaveAttribute('aria-valuetext', '2 stars');
        await expect(page.locator('.starrating')).toHaveAttribute('data-ui-title', '2 stars');
    });

    test('respects a reset canceled by a later listener', async ({ page }) => {
        await page.evaluate((_) => {
            const input = $.findOne('#rating');
            $.getData(input, 'starrating').setValue(4);
            input.form.addEventListener('reset', (event) => event.preventDefault());
            input.form.reset();
        });
        await page.clock.runFor(1);

        await expect(page.locator('#rating')).toHaveValue('4');
        await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '4');
    });

    test('finishes a reset when a later reset is canceled', async ({ page }) => {
        await page.evaluate((_) => {
            const input = $.findOne('#rating');
            $.getData(input, 'starrating').setValue(4);
            input.form.reset();
            input.form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
            input.form.reset();
        });
        await page.clock.runFor(1);

        await expect(page.locator('#rating')).toHaveValue('2');
        await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2');
    });

    test('preserves a value set after the native reset', async ({ page }) => {
        await page.evaluate((_) => {
            const input = $.findOne('#rating');
            input.form.reset();
            $.getData(input, 'starrating').setValue(4);
        });
        await page.clock.runFor(1);

        await expect(page.locator('#rating')).toHaveValue('4');
        await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '4');
    });

    test('ignores a pending reset after disposal and preserves other listeners', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.evaluate((_) => {
            const input = $.findOne('#rating');
            $.append(input.form, '<input id="second" type="number" value="3">');
            UI.StarRating.init($.findOne('#second'), { tooltip: false }).setValue(5);
            input.form.reset();
            $.getData(input, 'starrating').dispose();
        });
        await page.clock.runFor(1);

        await expect(page.locator('.starrating')).toHaveCount(1);
        await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '3');
        await page.evaluate((_) => {
            $.getData('#second', 'starrating').setValue(5);
            $.findOne('#form').reset();
        });
        await page.clock.runFor(1);
        await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '3');
        expect(errors).toEqual([]);
    });
});

test.describe('StarRating resets during drags', () => {
    for (const pointer of ['mouse', 'touch']) {
        test.describe(`${pointer} drag`, () => {
            test.beforeEach(async ({ page }) => {
                await page.evaluate((_) => {
                    const input = $.findOne('#rating');
                    const component = $.getData(input, 'starrating');
                    component.dispose();
                    UI.StarRating.init(input);
                    window.interruptedChanges = 0;
                    $.addEvent(input, 'change.ui.starrating', (_) => window.interruptedChanges++);
                });
                await page.evaluate(dispatchDragEvent, { pointer, phase: 'start', fraction: .1 });
                await page.evaluate(dispatchDragEvent, { pointer, phase: 'move', fraction: .5 });
                await page.evaluate((_) => window.interruptedChanges = 0);
            });

            test('resetting ends the drag and restores the default value', async ({ page }) => {
                await page.evaluate((_) => $.findOne('#form').reset());
                await page.clock.runFor(1);

                await expect(page.locator('#rating')).toHaveValue('2');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2');
                expect(await page.locator('.starrating-filled').evaluate((node) => node.style.transition)).toBe('');
                await page.locator('#other').focus();
                await expect(page.locator('.tooltip')).toHaveCount(0);

                await page.evaluate(dispatchDragEvent, { pointer, phase: 'move', fraction: .9 });
                await page.evaluate(dispatchDragEvent, { pointer, phase: 'end', fraction: .9 });
                await expect(page.locator('#rating')).toHaveValue('2');
                expect(await page.evaluate((_) => window.interruptedChanges)).toBe(0);

                await page.locator('.starrating').press('ArrowUp');
                await expect(page.locator('#rating')).toHaveValue('2.5');
            });

            test('canceling a reset allows the drag to continue', async ({ page }) => {
                await page.evaluate((_) => {
                    const form = $.findOne('#form');
                    form.addEventListener('reset', (event) => event.preventDefault());
                    form.reset();
                });
                await page.clock.runFor(1);

                await expect(page.locator('#rating')).toHaveValue('2.5');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2.5');

                await page.evaluate(dispatchDragEvent, { pointer, phase: 'move', fraction: .9 });
                await page.evaluate(dispatchDragEvent, { pointer, phase: 'end', fraction: .9 });
                await expect(page.locator('#rating')).toHaveValue('4.5');
                expect(await page.evaluate((_) => window.interruptedChanges)).toBe(1);

                await page.locator('.starrating').press('ArrowUp');
                await expect(page.locator('#rating')).toHaveValue('5');
            });
        });
    }
});

test.describe('StarRating form submission', () => {
    test('preserves native validation and submission with the input hidden from assistive technology', async ({ page }) => {
        await page.evaluate((_) => {
            $.setHtml(document.body, '<form id="form"><label for="rating">Rating</label><input id="rating" name="rating" type="number" min="1" max="5" step="0.5" required><button type="submit">Submit</button></form>');
            UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            window.submittedRating = null;
            $.findOne('#form').addEventListener('submit', (event) => {
                event.preventDefault();
                window.submittedRating = new FormData(event.target).get('rating');
            });
        });

        await page.getByRole('button', { name: 'Submit' }).click();
        expect(await page.evaluate((_) => window.submittedRating)).toBeNull();
        expect(await page.locator('#rating').evaluate((node) => node.validity.valueMissing)).toBe(true);
        await expect(page.getByRole('slider', { name: 'Rating' })).toBeFocused();
        await expect(page.getByRole('spinbutton')).toHaveCount(0);

        await page.evaluate((_) => $.getData('#rating', 'starrating').setValue(2.5));
        // Avoid Firefox's native validation popup intercepting the next mouse click.
        await page.getByRole('button', { name: 'Submit' }).press('Enter');
        expect(await page.evaluate((_) => window.submittedRating)).toBe('2.5');
        expect(await page.locator('#rating').evaluate((node) => node.validity.valid)).toBe(true);
    });
});
