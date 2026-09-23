import { expect, test } from '#test';
import { dispatchDragEvent } from '../setup/drag.js';

test.describe('StarRating', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate((_) => {
            $.setHtml(
                document.body,
                '<input id="rating" type="number"><input id="rating2" type="number">',
            );
        });
    });

    test.describe('#init', () => {
        for (const { name, init } of [
            { name: 'class', init: () => UI.StarRating.init($.findOne('#rating'), { tooltip: false }) },
            { name: 'QuerySet', init: () => $('#rating').starrating({ tooltip: false }) },
        ]) {
            test(`creates a StarRating (${name})`, async ({ page }) => {
                const instance = await page.evaluateHandle(init);
                expect(await instance.evaluate((value) => value instanceof UI.StarRating)).toBe(true);
                expect(await instance.evaluate((value) => $.getData('#rating', 'starrating') === value)).toBe(true);
                await expect(page.locator('.starrating')).toHaveCount(1);
            });
        }

        test('creates multiple StarRatings (QuerySet)', async ({ page }) => {
            await page.evaluate((_) => {
                $('input').starrating({ tooltip: false });
            });
            await expect(page.locator('.starrating')).toHaveCount(2);
        });

        test('returns the first StarRating (QuerySet)', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const first = $('input').starrating({ tooltip: false });
                return first === $.getData('#rating', 'starrating');
            })).toBe(true);
        });

        test('reuses an existing instance and its resolved options', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const input = $.findOne('#rating');
                const first = UI.StarRating.init(input, {
                    stars: 7,
                    tooltip: false,
                });
                const second = UI.StarRating.init(input, {
                    stars: 3,
                    tooltip: false,
                });
                return first === second;
            })).toBe(true);

            await expect(page.locator('.starrating-outline > svg')).toHaveCount(7);
        });

        test('exposes the input and frozen default options', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const input = $.findOne('#rating');
                const component = UI.StarRating.init(input);
                const { ratingText, ...options } = component.options;
                return {
                    options,
                    frozen: Object.isFrozen(component.options),
                    ownsInput: component.node === input,
                    singular: ratingText.call(component, 1),
                    plural: ratingText.call(component, 2),
                };
            })).toEqual({
                options: {
                    animate: true,
                    displayOnly: false,
                    hover: true,
                    max: null,
                    min: 0,
                    size: 'md',
                    stars: 5,
                    step: 1,
                    tooltip: true,
                },
                frozen: true,
                ownsInput: true,
                singular: '1 star',
                plural: '2 stars',
            });
        });

        test('resolves data attributes', async ({ page }) => {
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                $.setDataset(input, {
                    uiAnimate: false,
                    uiDisplayOnly: true,
                    uiHover: false,
                    uiMax: 6,
                    uiMin: 1,
                    uiSize: 'lg',
                    uiStars: 7,
                    uiStep: .5,
                    uiTooltip: false,
                });
                UI.StarRating.init(input);
            });

            const slider = page.locator('.starrating');
            await expect(slider).toHaveClass('starrating starrating-lg');
            await expect(slider).toHaveAttribute('aria-valuemin', '1');
            await expect(slider).toHaveAttribute('aria-valuemax', '6');
            await expect(slider).toHaveAttribute('aria-readonly', 'true');
            await expect(page.locator('.starrating-outline > svg')).toHaveCount(7);
            await expect(page.locator('.starrating-animate')).toHaveCount(0);
            expect(await page.evaluate((_) =>
                $.getData('#rating', 'starrating').options.hover)).toBe(false);
            expect(await page.evaluate((_) =>
                $.getData('#rating', 'starrating').options.step)).toBe(.5);
        });

        test('constructor options override data attributes', async ({ page }) => {
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                $.setDataset(input, {
                    uiDisplayOnly: true,
                    uiMax: 4,
                    uiMin: 1,
                    uiSize: 'sm',
                    uiStars: 4,
                });
                UI.StarRating.init(input, {
                    displayOnly: false,
                    max: 8,
                    min: 2,
                    size: 'xl',
                    stars: 8,
                    tooltip: false,
                });
            });

            const slider = page.locator('.starrating');
            await expect(slider).toHaveClass('starrating starrating-xl');
            await expect(slider).toHaveAttribute('aria-valuemin', '2');
            await expect(slider).toHaveAttribute('aria-valuemax', '8');
            await expect(slider).toHaveAttribute('aria-readonly', 'false');
            await expect(page.locator('.starrating-outline > svg')).toHaveCount(8);
        });
    });

    test.describe('#dispose', () => {
        for (const { name, dispose } of [
            { name: 'class', dispose: (instance) => instance.dispose() },
            { name: 'QuerySet', dispose: () => $('#rating').starrating('dispose') },
        ]) {
            test(`removes the StarRating and restores the original input (${name})`, async ({ page }) => {
                const instance = await page.evaluateHandle((_) => {
                    $.setHtml(
                        document.body,
                        '<input class="existing" id="rating" tabindex="4" type="number">',
                    );
                    const input = $.findOne('#rating');
                    const component = UI.StarRating.init(input, { tooltip: false });
                    $.addClass(input, 'runtime');
                    return component;
                });

                await page.evaluate(dispose, instance);

                const input = page.locator('#rating');
                await expect(input).toHaveClass('existing runtime');
                await expect(input).toHaveAttribute('tabindex', '4');
                await expect(page.locator('.starrating')).toHaveCount(0);
                expect(await page.evaluate((_) => $.hasData('#rating', 'starrating'))).toBe(false);
                expect(await instance.evaluate((value) => value.node)).toBeNull();
                expect(await instance.evaluate((value) => value.options)).toBeNull();
            });
        }

        test('restores existing hidden and absent tabindex state', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    '<input class="visually-hidden existing" id="rating" type="number">',
                );
                UI.StarRating.init($.findOne('#rating'), { tooltip: false }).dispose();
            });

            const input = page.locator('#rating');
            await expect(input).toHaveClass('visually-hidden existing');
            await expect(input).not.toHaveAttribute('tabindex');
            await expect(page.locator('.starrating')).toHaveCount(0);
        });

        for (const ariaHidden of [null, 'false', 'true']) {
            test(`restores original aria-hidden ${ariaHidden ?? 'absence'} after disposal`, async ({ page }) => {
                await page.evaluate((ariaHidden) => {
                    const input = document.querySelector('#rating');
                    if (ariaHidden !== null) {
                        input.setAttribute('aria-hidden', ariaHidden);
                    }
                    UI.StarRating.init(input, { tooltip: false });
                }, ariaHidden);

                const input = page.locator('#rating');
                await expect(input).toHaveAttribute('aria-hidden', 'true');
                await page.evaluate((_) => $.getData('#rating', 'starrating').dispose());

                if (ariaHidden === null) {
                    await expect(input).not.toHaveAttribute('aria-hidden');
                } else {
                    await expect(input).toHaveAttribute('aria-hidden', ariaHidden);
                }
            });
        }

        test('restores owned label IDs without removing runtime IDs', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    '<label>Generated <input id="rating" type="number"></label><label id="existing" for="rating">Existing</label>',
                );
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const labels = page.locator('label');
            await expect(labels.first()).toHaveAttribute('id', /^starrating-label/);
            await expect(labels.nth(1)).toHaveAttribute('id', 'existing');

            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                input.labels[0].id = 'runtime-label';
                $.getData(input, 'starrating').dispose();
            });
            await expect(labels.first()).toHaveAttribute('id', 'runtime-label');

            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                input.labels[0].removeAttribute('id');
                UI.StarRating.init(input, { tooltip: false });
            });
            await expect(labels.first()).toHaveAttribute('id', /^starrating-label/);

            await page.evaluate((_) => {
                $.getData('#rating', 'starrating').dispose();
            });
            await expect(labels.first()).not.toHaveAttribute('id');
            await expect(labels.nth(1)).toHaveAttribute('id', 'existing');
        });

        test('allows repeated disposal of the same instance', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const component = UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                component.dispose();
                component.dispose();
                return {
                    node: component.node,
                    options: component.options,
                    registered: $.hasData('#rating', 'starrating'),
                };
            })).toEqual({ node: null, options: null, registered: false });

            await expect(page.locator('.starrating')).toHaveCount(0);
            await expect(page.locator('#rating')).not.toHaveAttribute('aria-hidden');
        });

        test('can reinitialize after disposal', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const input = $.findOne('#rating');
                const first = UI.StarRating.init(input, { tooltip: false });
                first.dispose();
                const second = UI.StarRating.init(input, {
                    stars: 3,
                    tooltip: false,
                });
                return first !== second;
            })).toBe(true);

            await expect(page.locator('.starrating')).toHaveCount(1);
            await expect(page.locator('.starrating-outline > svg')).toHaveCount(3);
        });

        test('disposes automatically when the original input is removed', async ({ page }) => {
            const instance = await page.evaluateHandle((_) => {
                const input = $.findOne('#rating');
                const component = UI.StarRating.init(input, { tooltip: false });
                $.remove(input);
                return component;
            });

            await expect(page.locator('#rating')).toHaveCount(0);
            await expect(page.locator('.starrating')).toHaveCount(0);
            expect(await instance.evaluate((value) => value.node)).toBeNull();
            expect(await instance.evaluate((value) => value.options)).toBeNull();
        });

        test('cleans up an active drag and visible tooltip safely', async ({ page }) => {
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            const instance = await page.evaluateHandle((_) => {
                const input = $.findOne('#rating');
                const component = UI.StarRating.init(input);
                const slider = $.findOne('.starrating');
                const rect = slider.getBoundingClientRect();
                $.focus(slider);
                slider.dispatchEvent(new MouseEvent('mousedown', {
                    bubbles: true,
                    button: 0,
                    clientX: rect.left + (rect.width / 2),
                }));
                component.dispose();
                window.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: rect.right,
                }));
                window.dispatchEvent(new MouseEvent('mouseup', {
                    clientX: rect.right,
                }));
                return component;
            });

            await expect(page.locator('.starrating')).toHaveCount(0);
            await expect(page.locator('.tooltip')).toHaveCount(0);
            expect(errors).toEqual([]);
            expect(await instance.evaluate((value) => value.node)).toBeNull();
        });
    });

    test.describe('#disable', () => {
        for (const { name, action } of [
            { name: 'class', action: (instance) => instance.disable() },
            { name: 'QuerySet', action: () => $('#rating').starrating('disable') },
        ]) {
            test(`disables the StarRating (${name})`, async ({ page }) => {
                const instance = await page.evaluateHandle((_) => {
                    const input = $.findOne('#rating');
                    return UI.StarRating.init(input, { tooltip: false });
                });
                await page.evaluate(action, instance);

                const slider = page.locator('.starrating');
                await expect(page.locator('#rating')).toBeDisabled();
                await expect(slider).toHaveClass(/starrating-disabled/);
                await expect(slider).toHaveAttribute('aria-disabled', 'true');
                await expect(slider).toHaveAttribute('tabindex', '-1');
            });
        }

        test('ignores user interaction when disabled', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'), { tooltip: false }).disable();
                const slider = $.findOne('.starrating');
                const rect = slider.getBoundingClientRect();
                slider.dispatchEvent(new MouseEvent('mousedown', {
                    bubbles: true,
                    button: 0,
                    clientX: rect.right,
                }));
                slider.dispatchEvent(new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    code: 'ArrowRight',
                }));
            });

            const slider = page.locator('.starrating');
            await expect(page.locator('#rating')).toHaveValue('2');
            await expect(slider).toHaveClass(/starrating-disabled/);
            await expect(slider).toHaveAttribute('aria-disabled', 'true');
            await expect(slider).toHaveAttribute('tabindex', '-1');
            await expect(slider).toHaveCSS('pointer-events', 'none');
        });

        test('restores the committed rating when disabled during a hover preview', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'));
                window.disableChanges = 0;
                $.addEvent('#rating', 'change.ui.starrating', (_) => window.disableChanges++);
            });

            const slider = page.locator('.starrating');
            const filled = page.locator('.starrating-filled');
            const box = await slider.boundingBox();
            await page.mouse.move(
                box.x + (box.width * .9),
                box.y + (box.height / 2),
            );
            await expect(filled).toHaveAttribute('style', /width: 100%/);
            await expect(slider).toHaveAttribute('data-ui-title', '5 stars');

            await page.evaluate((_) => $.getData('#rating', 'starrating').disable());

            await expect(page.locator('#rating')).toBeDisabled();
            await expect(page.locator('#rating')).toHaveValue('2');
            await expect(filled).toHaveAttribute('style', /width: 40%/);
            await expect(slider).toHaveAttribute('aria-valuenow', '2');
            await expect(slider).toHaveAttribute('data-ui-title', '2 stars');

            await page.mouse.move(box.x + box.width + 20, box.y + box.height + 20);
            await expect(filled).toHaveAttribute('style', /width: 40%/);
            expect(await page.evaluate((_) => window.disableChanges)).toBe(0);
        });
    });

    test.describe('#enable', () => {
        for (const { name, action } of [
            { name: 'class', action: (instance) => instance.enable() },
            { name: 'QuerySet', action: () => $('#rating').starrating('enable') },
        ]) {
            test(`enables the StarRating (${name})`, async ({ page }) => {
                const instance = await page.evaluateHandle((_) => {
                    const input = $.findOne('#rating');
                    $.setAttribute(input, { disabled: true });
                    return UI.StarRating.init(input, { tooltip: false });
                });
                await page.evaluate(action, instance);

                const slider = page.locator('.starrating');
                await expect(page.locator('#rating')).toBeEnabled();
                await expect(slider).not.toHaveClass(/starrating-disabled/);
                await expect(slider).toHaveAttribute('aria-disabled', 'false');
                await expect(slider).toHaveAttribute('tabindex', '0');
            });
        }
    });

    test.describe('#getValue', () => {
        for (const { name, getValue } of [
            { name: 'class', getValue: (instance) => instance.getValue() },
            { name: 'QuerySet', getValue: () => $('#rating').starrating('getValue') },
        ]) {
            for (const { value, expected } of [
                { value: '', expected: null },
                { value: '3', expected: 3 },
            ]) {
                test(`gets the ${value || 'empty'} value (${name})`, async ({ page }) => {
                    const instance = await page.evaluateHandle((value) => {
                        $.setValue('#rating', value);
                        return UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                    }, value);

                    expect(await page.evaluate(getValue, instance)).toBe(expected);
                });
            }
        }
    });

    test.describe('#setValue', () => {
        for (const { name, setValue } of [
            { name: 'class', setValue: (instance) => instance.setValue(3) },
            { name: 'QuerySet', setValue: () => $('#rating').starrating('setValue', 3) },
        ]) {
            test(`sets the value (${name})`, async ({ page }) => {
                const instance = await page.evaluateHandle((_) =>
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false }));
                await page.evaluate(setValue, instance);

                await expect(page.locator('#rating')).toHaveValue('3');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '3');
            });
        }

        for (const { name, value } of [
            { name: 'invalid text', value: 'invalid' },
            { name: 'infinity', value: Number.POSITIVE_INFINITY },
            { name: 'null', value: null },
        ]) {
            test(`ignores ${name}`, async ({ page }) => {
                await page.evaluate((value) => {
                    $.setValue('#rating', 2);
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false }).setValue(value);
                }, value);

                await expect(page.locator('#rating')).toHaveValue('2');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2');
                await expect(page.locator('.starrating-filled')).not.toHaveAttribute('style', /NaN|Infinity/);
            });
        }
    });

    test.describe('input attributes', () => {
        test('renders the component structure and hides the input', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const input = page.locator('#rating');
            const slider = page.locator('.starrating');
            await expect(page.locator('.starrating-animate > .starrating')).toHaveCount(1);
            await expect(slider).toHaveClass('starrating starrating-md');
            await expect(slider.locator(':scope > .starrating-outline')).toHaveCount(1);
            await expect(slider.locator(':scope > .starrating-filled')).toHaveCount(1);
            await expect(slider.locator('.starrating-outline > svg')).toHaveCount(5);
            await expect(slider.locator('.starrating-filled > svg')).toHaveCount(5);
            await expect(input).toHaveClass('visually-hidden');
            await expect(input).toHaveAttribute('tabindex', '-1');
        });

        for (const focused of [false, true]) {
            test(`exposes one accessible control when initialized ${focused ? 'focused' : 'unfocused'}`, async ({ page }) => {
                await page.evaluate((focused) => {
                    document.body.innerHTML = '<button>Other control</button><label for="rating">Rating</label><input id="rating" type="number" value="2">';
                    const input = document.querySelector('#rating');
                    const focusTarget = focused ? input : document.querySelector('button');
                    focusTarget.focus();
                    UI.StarRating.init(input, { tooltip: false });
                }, focused);

                const control = page.getByRole('slider', { name: 'Rating' });
                await expect(control).toHaveCount(1);
                await expect(control).toHaveAttribute('aria-valuenow', '2');
                await expect(page.getByRole('spinbutton')).toHaveCount(0);
                await expect(page.locator('#rating')).toHaveAttribute('aria-hidden', 'true');
                await expect(focused ? control : page.getByRole('button')).toBeFocused();

                await page.locator('label').click();
                await expect(control).toBeFocused();
                await expect(page.getByRole('spinbutton')).toHaveCount(0);

                await page.evaluate((_) => $.getData('#rating', 'starrating').dispose());
                await expect(page.getByRole('slider')).toHaveCount(0);
                await expect(page.getByRole('spinbutton', { name: 'Rating' })).toHaveCount(1);
                await expect(page.locator('#rating')).toHaveValue('2');
            });
        }

        test('renders default slider ARIA state for an empty value', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const slider = page.locator('.starrating');
            await expect(page.locator('#rating')).toHaveValue('');
            await expect(slider).toHaveAttribute('role', 'slider');
            await expect(slider).toHaveAttribute('aria-valuemin', '0');
            await expect(slider).toHaveAttribute('aria-valuemax', '5');
            await expect(slider).toHaveAttribute('aria-valuenow', '0');
            await expect(slider).toHaveAttribute('aria-valuetext', '0 stars');
            await expect(slider).toHaveAttribute('aria-required', 'false');
            await expect(slider).toHaveAttribute('aria-readonly', 'false');
            await expect(slider).toHaveAttribute('aria-disabled', 'false');
            await expect(slider).toHaveAttribute('tabindex', '0');
            await expect(page.locator('.starrating-filled')).toHaveAttribute('style', /width: 0%/);
        });

        test('normalizes native attributes without changing frozen options', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    '<input id="rating" type="number" min=".1" max="2.1" step=".25" value=".2" readonly required>',
                );
                UI.StarRating.init($.findOne('#rating'), {
                    displayOnly: false,
                    max: 4,
                    min: 1,
                    step: 1,
                    tooltip: false,
                });
            });

            const input = page.locator('#rating');
            const slider = page.locator('.starrating');
            await expect(input).toHaveValue('0.35');
            await expect(slider).toHaveAttribute('aria-valuemin', '0.1');
            await expect(slider).toHaveAttribute('aria-valuemax', '2.1');
            await expect(slider).toHaveAttribute('aria-valuenow', '0.35');
            await expect(slider).toHaveAttribute('aria-required', 'true');
            await expect(slider).toHaveAttribute('aria-readonly', 'true');
            expect(await page.evaluate((_) =>
                $.getData('#rating', 'starrating').options.min)).toBe(1);
            expect(await page.evaluate((_) =>
                $.getData('#rating', 'starrating').options.max)).toBe(4);
            expect(await page.evaluate((_) =>
                $.getData('#rating', 'starrating').options.step)).toBe(1);
        });

        test('falls back from invalid native bounds and handles an invalid step safely', async ({ page }) => {
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                $.setAttribute(input, {
                    max: 'invalid',
                    min: 'invalid',
                    step: 'invalid',
                });
                $.setValue(input, .4);
                UI.StarRating.init(input, {
                    max: 4,
                    min: 1,
                    step: .5,
                    tooltip: false,
                });
            });

            const slider = page.locator('.starrating');
            await expect(page.locator('#rating')).toHaveValue('1');
            await expect(slider).toHaveAttribute('aria-valuemin', '1');
            await expect(slider).toHaveAttribute('aria-valuemax', '4');

            await page.evaluate((_) => {
                $.getData('#rating', 'starrating').setValue(1.234);
            });
            await expect(page.locator('#rating')).toHaveValue('1.234');
        });

        test('inherits an explicit aria-label when no labels exist', async ({ page }) => {
            await page.evaluate((_) => {
                $.setAttribute('#rating', { 'aria-label': 'Product rating' });
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            await expect(page.locator('.starrating')).toHaveAttribute(
                'aria-label',
                'Product rating',
            );
            await expect(page.locator('.starrating')).not.toHaveAttribute('aria-labelledby');
        });

        test('combines existing, wrapping, and multiple label references', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    '<span id="description">Description</span><label id="wrapper">Wrapped <input id="rating" type="number" aria-label="Fallback" aria-labelledby="description"></label><label id="external" for="rating">External</label>',
                );
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const slider = page.locator('.starrating');
            await expect(slider).toHaveAttribute(
                'aria-labelledby',
                'description wrapper external',
            );
            await expect(slider).not.toHaveAttribute('aria-label');
        });

        test('generates safe IDs for every unlabelled associated label', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    '<label>First</label><label>Second</label><input type="number">',
                );
                const input = $.findOne('input');
                input.id = 'rating"][data-invalid="';
                for (const label of $.find('label')) {
                    label.htmlFor = input.id;
                }
                UI.StarRating.init(input, { tooltip: false });
            });

            await expect(page.locator('label').first()).toHaveAttribute(
                'id',
                /^starrating-label/,
            );
            await expect(page.locator('label').nth(1)).toHaveAttribute(
                'id',
                /^starrating-label/,
            );
            await expect(page.locator('.starrating')).toHaveAttribute(
                'aria-labelledby',
                /^starrating-label\S+ starrating-label\S+$/,
            );
        });
    });

    test.describe('events', () => {
        test('normalizes external input changes without emitting another change', async ({ page }) => {
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                UI.StarRating.init(input, {
                    min: .1,
                    step: .2,
                    tooltip: false,
                });
                window.changeCount = 0;
                input.addEventListener('change', (_) => window.changeCount++);
                input.value = '.24';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });

            await expect(page.locator('#rating')).toHaveValue('0.3');
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '0.3');
            expect(await page.evaluate((_) => window.changeCount)).toBe(1);
        });

        test('emits one namespaced change for each distinct normalized value', async ({ page }) => {
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                const component = UI.StarRating.init(input, { tooltip: false });
                window.changeCount = 0;
                window.lastChangeNamespace = null;
                window.lastChangeSkipUpdate = null;
                $.addEvent(input, 'change.ui.starrating', (event) => {
                    window.changeCount++;
                    window.lastChangeNamespace = event.namespace;
                    window.lastChangeSkipUpdate = event.skipUpdate;
                });
                component.setValue(2);
                component.setValue(2);
                component.setValue(2.1);
                component.setValue(3);
                component.setValue(Number.NaN);
            });

            await expect(page.locator('#rating')).toHaveValue('3');
            expect(await page.evaluate((_) => window.changeCount)).toBe(2);
            expect(await page.evaluate((_) => window.lastChangeNamespace)).toBe('ui.starrating');
            expect(await page.evaluate((_) => window.lastChangeSkipUpdate)).toBe(true);
        });
    });

    test.describe('user events', () => {
        test.describe('click', () => {
            test('sets a value with a primary mouse click', async ({ page }) => {
                await page.evaluate((_) => {
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                });

                const slider = page.locator('.starrating');
                const box = await slider.boundingBox();
                await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
                await expect(page.locator('#rating')).toHaveValue('3');
                await expect(slider).toHaveAttribute('aria-valuenow', '3');
                await expect(slider).toBeFocused();
            });

            test('ignores secondary and invalid pointer input', async ({ page }) => {
                await page.evaluate((_) => {
                    const input = $.findOne('#rating');
                    UI.StarRating.init(input, { tooltip: false });
                    const slider = $.findOne('.starrating');
                    slider.dispatchEvent(new MouseEvent('mousedown', {
                        bubbles: true,
                        button: 1,
                        clientX: 400,
                    }));
                    slider.dispatchEvent(new Event('mousedown', {
                        bubbles: true,
                        cancelable: true,
                    }));
                });

                await expect(page.locator('#rating')).toHaveValue('');
                await expect(page.locator('.starrating-filled')).not.toHaveAttribute(
                    'style',
                    /NaN|Infinity/,
                );
            });
        });

        test.describe('keyboard', () => {
            for (const { key, value } of [
                { key: 'ArrowRight', value: '3' },
                { key: 'ArrowLeft', value: '1' },
                { key: 'ArrowUp', value: '3' },
                { key: 'ArrowDown', value: '1' },
                { key: 'PageUp', value: '3' },
                { key: 'PageDown', value: '1' },
                { key: 'End', value: '5' },
                { key: 'Home', value: '0' },
            ]) {
                test(`handles ${key} and prevents its default action`, async ({ page }) => {
                    await page.evaluate((_) => {
                        $.setValue('#rating', 2);
                        UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                        $.findOne('.starrating').addEventListener('keydown', (event) => {
                            window.keyDefaultPrevented = event.defaultPrevented;
                        });
                    });

                    await page.locator('.starrating').press(key);
                    await expect(page.locator('#rating')).toHaveValue(value);
                    expect(await page.evaluate((_) => window.keyDefaultPrevented)).toBe(true);
                });
            }

            test('moves by at least one step with Page keys when the step exceeds one', async ({ page }) => {
                await page.evaluate((_) => {
                    $.setAttribute('#rating', { step: '2' });
                    $.setValue('#rating', 4);
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                });

                const input = page.locator('#rating');
                const slider = page.locator('.starrating');
                await slider.press('PageDown');
                await expect(input).toHaveValue('2');
                await expect(slider).toHaveAttribute('aria-valuenow', '2');
                await slider.press('PageUp');
                await expect(input).toHaveValue('4');
                await slider.press('PageUp');
                await expect(input).toHaveValue('5');
                await slider.press('PageUp');
                await expect(input).toHaveValue('5');
                await slider.press('Home');
                await slider.press('PageDown');
                await expect(input).toHaveValue('0');
            });

            test('keeps the page position for handled slider keys', async ({ page }) => {
                await page.evaluate((_) => {
                    $.setHtml(
                        document.body,
                        '<div style="height: 1200px"></div><input id="rating" type="number" value="2"><div style="height: 1200px"></div>',
                    );
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                });

                const slider = page.locator('.starrating');
                await slider.focus();
                await page.evaluate((_) => window.scrollTo(0, 1000));
                await expect.poll(async (_) =>
                    page.evaluate((_) => window.scrollY)).toBe(1000);
                const initialScroll = await page.evaluate((_) => window.scrollY);
                await slider.press('ArrowDown');
                expect(await page.evaluate((_) => window.scrollY)).toBe(initialScroll);
            });

            test('uses direction-aware horizontal keyboard behavior in RTL', async ({ page }) => {
                await page.evaluate((_) => {
                    $.setAttribute('#rating', { dir: 'rtl' });
                    $.setValue('#rating', 2);
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                });

                const input = page.locator('#rating');
                const slider = page.locator('.starrating');
                await expect(slider).toHaveAttribute('dir', 'rtl');
                await slider.press('ArrowLeft');
                await expect(input).toHaveValue('3');
                await slider.press('ArrowRight');
                await expect(input).toHaveValue('2');
            });
        });

        test.describe('focus', () => {
            test('forwards focus from the hidden input', async ({ page }) => {
                await page.evaluate((_) => {
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                    $.focus('#rating');
                });

                await expect(page.locator('.starrating')).toBeFocused();
            });
        });

        test.describe('drag', () => {
            test('drags with the mouse in both directions', async ({ page }) => {
                await page.evaluate((_) => {
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                });

                const slider = page.locator('.starrating');
                const box = await slider.boundingBox();
                const y = box.y + (box.height / 2);
                await page.mouse.move(box.x + 1, y);
                await page.mouse.down();
                await page.mouse.move(box.x + box.width - 1, y);
                await page.mouse.up();
                await expect(page.locator('#rating')).toHaveValue('5');

                await page.mouse.move(box.x + box.width - 1, y);
                await page.mouse.down();
                await page.mouse.move(box.x + 1, y);
                await page.mouse.up();
                await expect(page.locator('#rating')).toHaveValue('1');
            });

            test('drags with touch and prevents handled touch movement', async ({ page }) => {
                await page.evaluate((_) => {
                    const input = $.findOne('#rating');
                    UI.StarRating.init(input, { tooltip: false });
                    const slider = $.findOne('.starrating');
                    const rect = slider.getBoundingClientRect();
                    const y = rect.top + (rect.height / 2);
                    const dispatchTouch = (target, type, x, active) => {
                        const event = new Event(type, {
                            bubbles: true,
                            cancelable: true,
                        });
                        Object.defineProperty(event, 'touches', {
                            value: active ? [{ pageX: x, pageY: y }] : [],
                        });
                        target.dispatchEvent(event);
                        return event.defaultPrevented;
                    };

                    dispatchTouch(slider, 'touchstart', rect.left + (rect.width * .2), true);
                    window.touchMovePrevented = dispatchTouch(
                        window,
                        'touchmove',
                        rect.left + (rect.width * .7),
                        true,
                    );
                    dispatchTouch(window, 'touchend', rect.left + (rect.width * .7), false);
                });

                await expect(page.locator('#rating')).toHaveValue('4');
                expect(await page.evaluate((_) => window.touchMovePrevented)).toBe(true);
                await expect(page.locator('.starrating-filled')).toHaveCSS(
                    'transition-property',
                    'width',
                );
            });

            for (const pointer of ['mouse', 'touch']) {
                test(`disabling ends a ${pointer} drag and preserves the committed value`, async ({ page }) => {
                    await page.evaluate((_) => {
                        $.setAttribute('#rating', { step: '.5', value: '2' });
                        UI.StarRating.init($.findOne('#rating'));
                        window.interruptedChanges = 0;
                        $.addEvent('#rating', 'change.ui.starrating', (_) => window.interruptedChanges++);
                    });
                    await page.evaluate(dispatchDragEvent, { pointer, phase: 'start', fraction: .1 });
                    await page.evaluate(dispatchDragEvent, { pointer, phase: 'move', fraction: .5 });
                    await page.evaluate((_) => window.interruptedChanges = 0);
                    await page.evaluate((_) => $.getData('#rating', 'starrating').disable());

                    await expect(page.locator('#rating')).toBeDisabled();
                    await expect(page.locator('#rating')).toHaveValue('2.5');
                    await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2.5');
                    expect(await page.locator('.starrating-filled').evaluate((node) => node.style.transition)).toBe('');
                    await page.locator('#rating2').focus();
                    await expect(page.locator('.tooltip')).toHaveCount(0);

                    await page.evaluate(dispatchDragEvent, { pointer, phase: 'move', fraction: .9 });
                    await page.evaluate(dispatchDragEvent, { pointer, phase: 'end', fraction: .9 });
                    await expect(page.locator('#rating')).toHaveValue('2.5');
                    expect(await page.evaluate((_) => window.interruptedChanges)).toBe(0);

                    await page.evaluate((_) => $.getData('#rating', 'starrating').enable());
                    await page.locator('.starrating').press('ArrowUp');
                    await expect(page.locator('#rating')).toHaveValue('3');
                });
            }

            test('cancels drag startup when a focus handler calls disable', async ({ page }) => {
                const errors = [];
                page.on('pageerror', (error) => errors.push(error.message));
                await page.evaluate((_) => {
                    const input = $.findOne('#rating');
                    $.setAttribute(input, { step: '.5', value: '2' });
                    const component = UI.StarRating.init(input, { tooltip: false });
                    const slider = $.findOne('.starrating');
                    const rect = slider.getBoundingClientRect();
                    window.focusChanges = 0;
                    input.addEventListener('change', (_) => window.focusChanges++);
                    slider.addEventListener('focus', (_) => component.disable(), { once: true });
                    slider.dispatchEvent(new MouseEvent('mousedown', {
                        button: 0,
                        clientX: rect.left + (rect.width * .9),
                    }));
                    window.dispatchEvent(new MouseEvent('mousemove', { clientX: rect.right }));
                    window.dispatchEvent(new MouseEvent('mouseup', { clientX: rect.right }));
                });

                await expect(page.locator('#rating')).toHaveValue('2');
                await expect(page.locator('#rating')).toBeDisabled();
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2');
                expect(await page.locator('.starrating-filled').evaluate((node) => node.style.transition)).toBe('');
                expect(await page.evaluate((_) => window.focusChanges)).toBe(0);
                expect(errors).toEqual([]);
            });

            test('cancels drag startup when a focus handler calls dispose', async ({ page }) => {
                const errors = [];
                page.on('pageerror', (error) => errors.push(error.message));
                await page.evaluate((_) => {
                    const input = $.findOne('#rating');
                    $.setAttribute(input, { step: '.5', value: '2' });
                    const component = UI.StarRating.init(input, { tooltip: false });
                    const slider = $.findOne('.starrating');
                    const rect = slider.getBoundingClientRect();
                    window.focusChanges = 0;
                    input.addEventListener('change', (_) => window.focusChanges++);
                    slider.addEventListener('focus', (_) => component.dispose(), { once: true });
                    slider.dispatchEvent(new MouseEvent('mousedown', {
                        button: 0,
                        clientX: rect.left + (rect.width * .9),
                    }));
                    window.dispatchEvent(new MouseEvent('mousemove', { clientX: rect.right }));
                    window.dispatchEvent(new MouseEvent('mouseup', { clientX: rect.right }));
                });

                await expect(page.locator('#rating')).toHaveValue('2');
                await expect(page.locator('.starrating')).toHaveCount(0);
                expect(await page.evaluate((_) => window.focusChanges)).toBe(0);
                expect(errors).toEqual([]);
            });

            test('does not retain a drag tooltip when a change handler disables the control', async ({ page }) => {
                await page.evaluate((_) => {
                    const input = $.findOne('#rating');
                    $.setAttribute(input, { step: '.5', value: '2' });
                    const component = UI.StarRating.init(input);
                    $.addEvent(input, 'change.ui.starrating', (_) => component.disable());
                    const slider = $.findOne('.starrating');
                    const rect = slider.getBoundingClientRect();
                    slider.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: rect.left + (rect.width * .5) }));
                });
                await page.locator('#rating2').focus();

                await expect(page.locator('#rating')).toBeDisabled();
                await expect(page.locator('#rating')).toHaveValue('2.5');
                await expect(page.locator('.tooltip')).toHaveCount(0);
                expect(await page.locator('.starrating-filled').evaluate((node) => node.style.transition)).toBe('');
            });
        });
    });

    test.describe('animate option', () => {
        for (const { name, options, count } of [
            { name: 'by default', options: {}, count: 1 },
            { name: 'when disabled', options: { animate: false }, count: 0 },
        ]) {
            test(`renders ${count} animated wrappers ${name}`, async ({ page }) => {
                await page.evaluate((options) => {
                    UI.StarRating.init($.findOne('#rating'), { ...options, tooltip: false });
                }, options);

                await expect(page.locator('.starrating-animate')).toHaveCount(count);
                await expect(page.locator('.starrating-animate > .starrating')).toHaveCount(count);
                await expect(page.locator('.starrating')).toHaveCount(1);
            });
        }
    });

    test.describe('displayOnly option', () => {
        test('renders display-only controls without interaction handlers', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'), {
                    displayOnly: true,
                    tooltip: false,
                });
                const slider = $.findOne('.starrating');
                const rect = slider.getBoundingClientRect();
                slider.dispatchEvent(new MouseEvent('mousedown', {
                    bubbles: true,
                    button: 0,
                    clientX: rect.right,
                }));
                slider.dispatchEvent(new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    code: 'ArrowRight',
                }));
            });

            const slider = page.locator('.starrating');
            await expect(page.locator('#rating')).toHaveValue('2');
            await expect(slider).toHaveAttribute('aria-readonly', 'true');
            await expect(slider).toHaveAttribute('tabindex', '0');
        });
    });

    test.describe('hover option', () => {
        test('previews a hovered rating and restores the committed value on leave', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const slider = page.locator('.starrating');
            const filled = page.locator('.starrating-filled');
            const box = await slider.boundingBox();
            await page.mouse.move(
                box.x + (box.width * .7),
                box.y + (box.height / 2),
            );
            await expect(filled).toHaveAttribute('style', /width: 80%/);
            await expect(page.locator('#rating')).toHaveValue('2');

            await page.mouse.move(box.x + box.width + 20, box.y + box.height + 20);
            await expect(filled).toHaveAttribute('style', /width: 40%/);
            await expect(page.locator('#rating')).toHaveValue('2');
        });

        test('does not preview when hover is false', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'), {
                    hover: false,
                    tooltip: false,
                });
            });

            const slider = page.locator('.starrating');
            const box = await slider.boundingBox();
            await page.mouse.move(
                box.x + (box.width * .8),
                box.y + (box.height / 2),
            );
            await expect(page.locator('#rating')).toHaveValue('2');
            await expect(page.locator('.starrating-filled')).toHaveAttribute(
                'style',
                /width: 40%/,
            );
        });
    });

    test.describe('min, max, and step options', () => {
        test('clamps and anchors stepped values to the effective minimum', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), {
                    max: 1.1,
                    min: .1,
                    step: .2,
                    tooltip: false,
                }).setValue(.2);
            });
            await expect(page.locator('#rating')).toHaveValue('0.3');
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '0.3');

            await page.evaluate((_) => {
                $.getData('#rating', 'starrating').setValue(-10);
            });
            await expect(page.locator('#rating')).toHaveValue('0.1');

            await page.evaluate((_) => {
                $.getData('#rating', 'starrating').setValue(10);
            });
            await expect(page.locator('#rating')).toHaveValue('1.1');
        });

        test('handles decimal exponent precision', async ({ page }) => {
            await page.evaluate((_) => {
                $.setAttribute('#rating', {
                    min: '1e-7',
                    step: '2e-7',
                });
                UI.StarRating.init($.findOne('#rating'), {
                    max: .00001,
                    tooltip: false,
                }).setValue(2e-7);
            });

            await expect(page.locator('#rating')).toHaveValue('3e-7');
            await expect(page.locator('.starrating')).toHaveAttribute(
                'aria-valuenow',
                '3e-7',
            );
        });

        for (const step of ['1e-320', '1e-20', '5e-16']) {
            test(`preserves valid ratings without drift for step ${step}`, async ({ page }) => {
                await page.evaluate((step) => {
                    $.setAttribute('#rating', { step, value: '2' });
                    UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                    window.tinyStepChanges = 0;
                    $.addEvent('#rating', 'change.ui.starrating', (_) => window.tinyStepChanges++);
                }, step);

                await expect(page.locator('#rating')).toHaveValue('2');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuetext', '2 stars');
                await expect(page.locator('.starrating-filled')).toHaveAttribute('style', /width: 40%/);

                await page.evaluate((_) => $.getData('#rating', 'starrating').setValue(2));
                await expect(page.locator('#rating')).toHaveValue('2');
                expect(await page.evaluate((_) => window.tinyStepChanges)).toBe(0);

                await page.evaluate((_) => {
                    const rating = $.getData('#rating', 'starrating');
                    rating.setValue(3.5);
                    rating.setValue(3.5);
                });

                await expect(page.locator('#rating')).toHaveValue('3.5');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '3.5');
                await expect(page.locator('.starrating')).toHaveAttribute('aria-valuetext', '3.5 stars');
                await expect(page.locator('.starrating-filled')).toHaveAttribute('style', /width: 70%/);
                expect(await page.evaluate((_) => window.tinyStepChanges)).toBe(1);
            });
        }

        test('preserves unrestricted fractional values for step any', async ({ page }) => {
            await page.evaluate((_) => {
                $.setAttribute('#rating', { step: 'any' });
                UI.StarRating.init($.findOne('#rating'), { tooltip: false })
                    .setValue(.4444);
            });

            await expect(page.locator('#rating')).toHaveValue('0.4444');
            await expect(page.locator('.starrating')).toHaveAttribute(
                'aria-valuenow',
                '0.4444',
            );
        });

        test('normalizes invalid component configuration safely', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), {
                    max: Number.NaN,
                    min: Number.POSITIVE_INFINITY,
                    stars: Number.NaN,
                    step: -1,
                    tooltip: false,
                }).setValue(.375);
            });

            await expect(page.locator('.starrating-outline > svg')).toHaveCount(5);
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuemin', '0');
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuemax', '5');
            await expect(page.locator('#rating')).toHaveValue('0.375');
        });
    });

    test.describe('stars option', () => {
        test('renders a normalized custom star count', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), {
                    stars: 7.9,
                    tooltip: false,
                });
            });

            await expect(page.locator('.starrating-outline > svg')).toHaveCount(7);
            await expect(page.locator('.starrating-filled > svg')).toHaveCount(7);
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuemax', '7');
        });
    });

    test.describe('ratingText option', () => {
        test('updates tooltip and ARIA text with custom rating text', async ({ page }) => {
            await page.evaluate((_) => {
                const component = UI.StarRating.init($.findOne('#rating'), {
                    ratingText: (rating) => `Score ${rating} of 5`,
                });
                component.setValue(3);
            });

            const slider = page.locator('.starrating');
            await expect(slider).toHaveAttribute('aria-valuetext', 'Score 3 of 5');
            await expect(slider).toHaveAttribute('data-ui-title', 'Score 3 of 5');
            await slider.focus();
            await expect(page.locator('.tooltip-inner')).toHaveText('Score 3 of 5');
        });
    });

    test.describe('tooltip option', () => {
        test('shows the current rating text on focus and removes it on blur', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'));
            });

            await page.locator('.starrating').focus();
            await expect(page.locator('.tooltip')).toBeVisible();
            await expect(page.locator('.tooltip-inner')).toHaveText('2 stars');
            await expect(page.locator('.tooltip')).toHaveAttribute('role', 'tooltip');

            await page.locator('#rating2').focus();
            await expect(page.locator('.tooltip')).toHaveCount(0);
        });

        test('keeps the tooltip visible until every interaction trigger ends', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'));
            });

            const slider = page.locator('.starrating');
            await slider.focus();
            await slider.dispatchEvent('mouseenter');
            await expect(page.locator('.tooltip')).toBeVisible();
            await slider.dispatchEvent('mouseleave');
            await expect(page.locator('.tooltip')).toBeVisible();
            await page.locator('#rating2').focus();
            await expect(page.locator('.tooltip')).toHaveCount(0);
        });

        test('previews tooltip content without changing accessible committed state', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'));
            });

            const slider = page.locator('.starrating');
            const box = await slider.boundingBox();
            await page.mouse.move(
                box.x + (box.width * .7),
                box.y + (box.height / 2),
            );
            await expect(page.locator('.tooltip-inner')).toHaveText('4 stars');
            await expect(page.locator('#rating')).toHaveValue('2');
            await expect(slider).toHaveAttribute('aria-valuenow', '2');
        });

        test('does not create tooltip state when disabled by option', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const slider = page.locator('.starrating');
            await slider.focus();
            await slider.hover();
            await expect(page.locator('.tooltip')).toHaveCount(0);
            await expect(slider).not.toHaveAttribute('data-ui-title');
        });
    });

    test.describe('customization', () => {
        test('uses customized defaults', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.defaults.stars = 3;
                UI.StarRating.defaults.tooltip = false;
                UI.StarRating.init($.findOne('#rating'));
            });

            await expect(page.locator('.starrating-outline > svg')).toHaveCount(3);
            await expect(page.locator('.starrating-filled > svg')).toHaveCount(3);
        });

        test('uses customized classes', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.classes.animate = 'custom-animate';
                UI.StarRating.classes.container = 'custom-rating';
                UI.StarRating.classes.filled = 'custom-filled';
                UI.StarRating.classes.hide = 'custom-hidden';
                UI.StarRating.classes.outline = 'custom-outline';
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const rating = page.locator('.custom-rating');
            await expect(page.locator('.custom-animate > .custom-rating')).toHaveCount(1);
            await expect(rating.locator(':scope > .custom-outline')).toHaveCount(1);
            await expect(rating.locator(':scope > .custom-filled')).toHaveCount(1);
            await expect(page.locator('#rating')).toHaveClass('custom-hidden');
        });

        test('uses customized icons', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.icons.outline = '<span class="custom-outline-icon">○</span>';
                UI.StarRating.icons.filled = '<span class="custom-filled-icon">●</span>';
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            await expect(page.locator('.custom-outline-icon')).toHaveCount(5);
            await expect(page.locator('.custom-filled-icon')).toHaveCount(5);
            await expect(page.locator('.custom-outline-icon').first()).toHaveText('○');
            await expect(page.locator('.custom-filled-icon').first()).toHaveText('●');
        });

        test('uses customized language', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.lang.star = 'point';
                UI.StarRating.lang.stars = 'points';
                UI.StarRating.init($.findOne('#rating'), { tooltip: false })
                    .setValue(1);
            });

            const slider = page.locator('.starrating');
            await expect(slider).toHaveAttribute('aria-valuetext', '1 point');

            await page.evaluate((_) => {
                $.getData('#rating', 'starrating').setValue(2);
            });
            await expect(slider).toHaveAttribute('aria-valuetext', '2 points');
        });
    });
});
