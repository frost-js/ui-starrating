import { expect, test } from '#test';
import { resetPage } from '../setup/browser.js';

test.beforeEach(async ({ page }) => {
    await resetPage(page);
    await page.mouse.move(799, 599);
});

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
        test('creates a StarRating', async ({ page }) => {
            expect(await page.evaluate((_) =>
                UI.StarRating.init(
                    $.findOne('#rating'),
                    { tooltip: false },
                ) instanceof UI.StarRating)).toBe(true);
        });

        test('creates a StarRating (query)', async ({ page }) => {
            expect(await page.evaluate((_) =>
                $('#rating').starrating({ tooltip: false }) instanceof UI.StarRating)).toBe(true);
        });

        test('creates multiple StarRatings (query)', async ({ page }) => {
            await page.evaluate((_) => {
                $('input').starrating({ tooltip: false });
            });
            await expect(page.locator('.starrating')).toHaveCount(2);
        });

        test('returns the first StarRating (query)', async ({ page }) => {
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
                const component = UI.StarRating.init(input, { tooltip: false });
                return component.node === input;
            })).toBe(true);
            expect(await page.evaluate((_) =>
                Object.isFrozen($.getData('#rating', 'starrating').options))).toBe(true);
            expect(await page.evaluate((_) =>
                $.getData('#rating', 'starrating').options.stars)).toBe(5);
            expect(await page.evaluate((_) =>
                $.getData('#rating', 'starrating').options.step)).toBe(1);
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
        test('removes the StarRating and restores the original input', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    '<input class="existing" id="rating" tabindex="4" type="number">',
                );
                const input = $.findOne('#rating');
                const component = UI.StarRating.init(input, { tooltip: false });
                $.addClass(input, 'runtime');
                component.dispose();
                window.disposedNode = component.node;
                window.disposedOptions = component.options;
            });

            const input = page.locator('#rating');
            await expect(input).toHaveClass('existing runtime');
            await expect(input).toHaveAttribute('tabindex', '4');
            await expect(page.locator('.starrating')).toHaveCount(0);
            expect(await page.evaluate((_) => $.hasData('#rating', 'starrating'))).toBe(false);
            expect(await page.evaluate((_) => window.disposedNode)).toBeNull();
            expect(await page.evaluate((_) => window.disposedOptions)).toBeNull();
        });

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

        test('removes the StarRating (query)', async ({ page }) => {
            await page.evaluate((_) => {
                $('#rating').starrating({ tooltip: false });
                $('#rating').starrating('dispose');
            });

            await expect(page.locator('.starrating')).toHaveCount(0);
            expect(await page.evaluate((_) => $.hasData('#rating', 'starrating'))).toBe(false);
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
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                window.removedComponent = UI.StarRating.init(input, { tooltip: false });
                $.remove(input);
            });

            await expect(page.locator('#rating')).toHaveCount(0);
            await expect(page.locator('.starrating')).toHaveCount(0);
            expect(await page.evaluate((_) => window.removedComponent.node)).toBeNull();
            expect(await page.evaluate((_) => window.removedComponent.options)).toBeNull();
        });

        test('cleans up an active drag and visible tooltip safely', async ({ page }) => {
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                const component = UI.StarRating.init(input);
                const slider = $.findOne('.starrating');
                const rect = slider.getBoundingClientRect();
                window.disposalErrors = 0;
                window.addEventListener('error', (_) => window.disposalErrors++);
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
                window.dragDisposedComponent = component;
            });

            await expect(page.locator('.starrating')).toHaveCount(0);
            await expect(page.locator('.tooltip')).toHaveCount(0);
            expect(await page.evaluate((_) => window.disposalErrors)).toBe(0);
            expect(await page.evaluate((_) => window.dragDisposedComponent.node)).toBeNull();
        });
    });

    test.describe('#disable', () => {
        test('disables the StarRating', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), { tooltip: false }).disable();
            });

            const slider = page.locator('.starrating');
            await expect(page.locator('#rating')).toBeDisabled();
            await expect(slider).toHaveClass(/starrating-disabled/);
            await expect(slider).toHaveAttribute('aria-disabled', 'true');
            await expect(slider).toHaveAttribute('tabindex', '-1');
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

        test('disables the StarRating (query)', async ({ page }) => {
            await page.evaluate((_) => {
                $('#rating').starrating({ tooltip: false });
                $('#rating').starrating('disable');
            });

            await expect(page.locator('#rating')).toBeDisabled();
            await expect(page.locator('.starrating')).toHaveAttribute('aria-disabled', 'true');
        });
    });

    test.describe('#enable', () => {
        test('enables the StarRating', async ({ page }) => {
            await page.evaluate((_) => {
                const input = $.findOne('#rating');
                $.setAttribute(input, { disabled: true });
                UI.StarRating.init(input, { tooltip: false }).enable();
            });

            const slider = page.locator('.starrating');
            await expect(page.locator('#rating')).toBeEnabled();
            await expect(slider).not.toHaveClass(/starrating-disabled/);
            await expect(slider).toHaveAttribute('aria-disabled', 'false');
            await expect(slider).toHaveAttribute('tabindex', '0');
        });

        test('enables the StarRating (query)', async ({ page }) => {
            await page.evaluate((_) => {
                $.setAttribute('#rating', { disabled: true });
                $('#rating').starrating({ tooltip: false });
                $('#rating').starrating('enable');
            });

            await expect(page.locator('#rating')).toBeEnabled();
            await expect(page.locator('.starrating')).toHaveAttribute('aria-disabled', 'false');
        });
    });

    test.describe('#getValue', () => {
        test('gets an empty value', async ({ page }) => {
            expect(await page.evaluate((_) =>
                UI.StarRating.init(
                    $.findOne('#rating'),
                    { tooltip: false },
                ).getValue())).toBeNull();
        });

        test('gets the initial value', async ({ page }) => {
            expect(await page.evaluate((_) => {
                $.setValue('#rating', 3);
                return UI.StarRating.init(
                    $.findOne('#rating'),
                    { tooltip: false },
                ).getValue();
            })).toBe(3);
        });

        test('gets the value (query)', async ({ page }) => {
            expect(await page.evaluate((_) => {
                $.setValue('#rating', 3);
                $('#rating').starrating({ tooltip: false });
                return $('#rating').starrating('getValue');
            })).toBe(3);
        });
    });

    test.describe('#setValue', () => {
        test('sets the value', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init(
                    $.findOne('#rating'),
                    { tooltip: false },
                ).setValue(3);
            });

            await expect(page.locator('#rating')).toHaveValue('3');
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '3');
        });

        test('sets the value (query)', async ({ page }) => {
            await page.evaluate((_) => {
                $('#rating').starrating({ tooltip: false });
                $('#rating').starrating('setValue', 3);
            });

            await expect(page.locator('#rating')).toHaveValue('3');
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '3');
        });

        test('ignores invalid and non-finite values', async ({ page }) => {
            await page.evaluate((_) => {
                const component = UI.StarRating.init(
                    $.findOne('#rating'),
                    { tooltip: false },
                );
                component.setValue(2);
                component.setValue('invalid');
                component.setValue(Number.POSITIVE_INFINITY);
                component.setValue(null);
            });

            await expect(page.locator('#rating')).toHaveValue('2');
            await expect(page.locator('.starrating-filled')).not.toHaveAttribute(
                'style',
                /NaN|Infinity/,
            );
        });
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

        test('handles every slider key and prevents its default action', async ({ page }) => {
            await page.evaluate((_) => {
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const input = page.locator('#rating');
            const slider = page.locator('.starrating');
            await slider.press('ArrowRight');
            await expect(input).toHaveValue('3');
            await slider.press('ArrowLeft');
            await expect(input).toHaveValue('2');
            await slider.press('ArrowUp');
            await expect(input).toHaveValue('3');
            await slider.press('ArrowDown');
            await expect(input).toHaveValue('2');
            await slider.press('PageUp');
            await expect(input).toHaveValue('3');
            await slider.press('PageDown');
            await expect(input).toHaveValue('2');
            await slider.press('End');
            await expect(input).toHaveValue('5');
            await slider.press('Home');
            await expect(input).toHaveValue('0');

            expect(await slider.evaluate((node) => {
                const event = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    code: 'ArrowRight',
                });
                node.dispatchEvent(event);
                return event.defaultPrevented;
            })).toBe(true);
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

        test('forwards focus from the hidden input', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                $.focus('#rating');
            });

            await expect(page.locator('.starrating')).toBeFocused();
        });
    });

    test.describe('animate option', () => {
        test('renders an animated wrapper by default', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            await expect(page.locator('.starrating-animate > .starrating')).toHaveCount(1);
        });

        test('does not render an animated wrapper when disabled', async ({ page }) => {
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), {
                    animate: false,
                    tooltip: false,
                });
            });

            await expect(page.locator('.starrating-animate')).toHaveCount(0);
            await expect(page.locator('.starrating')).toHaveCount(1);
        });
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

        test('does not preview when disabled', async ({ page }) => {
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

        test('preserves valid ratings when a tiny step overflows the step count', async ({ page }) => {
            await page.evaluate((_) => {
                $.setAttribute('#rating', { step: '1e-320', value: '2' });
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            await expect(page.locator('#rating')).toHaveValue('2');
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '2');
            await expect(page.locator('.starrating-filled')).toHaveAttribute('style', /width: 40%/);

            await page.evaluate((_) => $.getData('#rating', 'starrating').setValue(3.5));

            await expect(page.locator('#rating')).toHaveValue('3.5');
            await expect(page.locator('.starrating')).toHaveAttribute('aria-valuenow', '3.5');
            await expect(page.locator('.starrating-filled')).toHaveAttribute('style', /width: 70%/);
        });

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

    test.describe('size option', () => {
        test('renders every size and preserves the public size custom property', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    ['xs', 'sm', 'md', 'lg', 'xl']
                        .map((size) => `<input id="${size}" type="number">`)
                        .join(''),
                );
                for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
                    UI.StarRating.init($.findOne(`#${size}`), {
                        size,
                        tooltip: false,
                    });
                }
            });

            const sliders = page.locator('.starrating');
            await expect(sliders).toHaveCount(5);
            for (const [index, size] of ['xs', 'sm', 'md', 'lg', 'xl'].entries()) {
                await expect(sliders.nth(index)).toHaveClass(`starrating starrating-${size}`);
            }
            await expect(sliders.first()).toHaveCSS('font-size', '16px');
            expect(await sliders.last().evaluate((node) =>
                Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThan(16);
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

    test.describe('styles, direction, and layout', () => {
        test('renders a visible focus ring and UI-managed reduced motion', async ({ page }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.evaluate((_) => {
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            await page.keyboard.press('Tab');
            const slider = page.locator('.starrating');
            await expect(slider).toBeFocused();
            await expect(slider).not.toHaveCSS('box-shadow', 'none');
            await expect(page.locator('.starrating-filled')).toHaveCSS(
                'transition-duration',
                '0s',
            );
        });

        test('anchors fill and pointer values to the inline start in RTL', async ({ page }) => {
            await page.evaluate((_) => {
                $.setAttribute('#rating', { dir: 'rtl' });
                $.setValue('#rating', 2);
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
            });

            const slider = page.locator('.starrating');
            const filled = page.locator('.starrating-filled');
            await expect(slider).toHaveCSS('direction', 'rtl');
            expect(await filled.evaluate((node) => {
                const fillRect = node.getBoundingClientRect();
                const sliderRect = node.parentElement.getBoundingClientRect();
                return Math.abs(fillRect.right - sliderRect.right);
            })).toBeLessThan(1);

            const box = await slider.boundingBox();
            const y = box.y + (box.height / 2);
            await page.mouse.click(box.x + 1, y);
            await expect(page.locator('#rating')).toHaveValue('5');
            await page.mouse.click(box.x + box.width - 1, y);
            await expect(page.locator('#rating')).toHaveValue('1');
        });

        test('handles hidden or zero-width layout without invalid styles', async ({ page }) => {
            await page.evaluate((_) => {
                $.setHtml(
                    document.body,
                    '<div hidden><input id="rating" type="number"></div>',
                );
                UI.StarRating.init($.findOne('#rating'), { tooltip: false });
                $.findOne('.starrating').dispatchEvent(new MouseEvent('mousedown', {
                    bubbles: true,
                    button: 0,
                    clientX: 0,
                }));
            });

            await expect(page.locator('#rating')).toHaveValue('');
            await expect(page.locator('.starrating-filled')).not.toHaveAttribute(
                'style',
                /NaN|Infinity/,
            );
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
