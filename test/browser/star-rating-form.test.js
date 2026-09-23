import { expect, test } from '#test';
import { resetPage } from '../setup/browser.js';

test.beforeEach(async ({ page }) => {
    await resetPage(page);
    await page.mouse.move(799, 599);
    await page.clock.install();
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

test.describe('StarRating interrupted drags', () => {
    for (const pointer of ['mouse', 'touch']) {
        for (const action of ['disable', 'reset', 'canceled reset']) {
            test(`${action} during a ${pointer} drag`, async ({ page }) => {
                await page.evaluate(({ pointer, action }) => {
                    const input = $.findOne('#rating');
                    const component = $.getData(input, 'starrating');
                    component.dispose();
                    UI.StarRating.init(input);
                    const slider = $.findOne('.starrating');
                    const rect = slider.getBoundingClientRect();
                    window.dragEvent = (phase, fraction) => {
                        const x = rect.left + (rect.width * fraction);
                        const y = rect.top + (rect.height / 2);
                        const target = phase === 'start' ? slider : window;
                        if (pointer === 'mouse') {
                            const type = { start: 'mousedown', move: 'mousemove', end: 'mouseup' }[phase];
                            target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y }));
                        } else {
                            const type = { start: 'touchstart', move: 'touchmove', end: 'touchend' }[phase];
                            const event = new Event(type, { bubbles: true, cancelable: true });
                            Object.defineProperty(event, 'touches', { value: phase === 'end' ? [] : [{ pageX: x, pageY: y }] });
                            Object.defineProperty(event, 'changedTouches', { value: [{ pageX: x, pageY: y }] });
                            target.dispatchEvent(event);
                        }
                    };
                    window.dragEvent('start', .1);
                    window.dragEvent('move', .5);
                    window.interruptedChanges = 0;
                    $.addEvent(input, 'change.ui.starrating', (_) => window.interruptedChanges++);
                    if (action === 'disable') {
                        $.getData(input, 'starrating').disable();
                    } else {
                        if (action === 'canceled reset') {
                            input.form.addEventListener('reset', (event) => event.preventDefault());
                        }
                        input.form.reset();
                    }
                }, { pointer, action });
                await page.clock.runFor(1);

                const expected = action === 'reset' ? '2' : '2.5';
                await expect(page.locator('#rating')).toHaveValue(expected);
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', expected);
                if (action !== 'canceled reset') {
                    expect(await page.locator('.starrating-filled').evaluate((node) => node.style.transition)).toBe('');
                    await page.locator('#other').focus();
                    await expect(page.locator('.tooltip')).toHaveCount(0);
                }

                await page.evaluate((_) => {
                    window.dragEvent('move', .9);
                    window.dragEvent('end', .9);
                });
                await expect(page.locator('#rating')).toHaveValue(action === 'canceled reset' ? '4.5' : expected);
                expect(await page.evaluate((_) => window.interruptedChanges)).toBe(action === 'canceled reset' ? 1 : 0);

                if (action === 'disable') {
                    await page.evaluate((_) => $.getData('#rating', 'starrating').enable());
                }
                await page.locator('.starrating').press('ArrowUp');
                const nextValues = { 'disable': '3', 'reset': '2.5', 'canceled reset': '5' };
                await expect(page.locator('#rating')).toHaveValue(nextValues[action]);
            });
        }
    }

    test('does not retain a drag tooltip when a change handler disables the control', async ({ page }) => {
        await page.evaluate((_) => {
            const input = $.findOne('#rating');
            $.getData(input, 'starrating').dispose();
            const component = UI.StarRating.init(input);
            $.addEvent(input, 'change.ui.starrating', (_) => component.disable());
            const slider = $.findOne('.starrating');
            const rect = slider.getBoundingClientRect();
            slider.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: rect.left + (rect.width * .5) }));
        });
        await page.locator('#other').focus();

        await expect(page.locator('#rating')).toBeDisabled();
        await expect(page.locator('#rating')).toHaveValue('2.5');
        await expect(page.locator('.tooltip')).toHaveCount(0);
        expect(await page.locator('.starrating-filled').evaluate((node) => node.style.transition)).toBe('');
    });
});
