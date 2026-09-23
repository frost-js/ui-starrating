import { expect, test } from '#test';

test.describe('StarRating layout', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate((_) => {
            $.setHtml(document.body, '<input id="rating" type="number">');
        });
    });

    test.describe('size option', () => {
        for (const { size, fontSize } of [
            { size: 'xs', fontSize: 16 },
            { size: 'sm', fontSize: 24 },
            { size: 'md', fontSize: 28.48 },
            { size: 'lg', fontSize: 32.72 },
            { size: 'xl', fontSize: 36.96 },
        ]) {
            test(`renders size ${size}`, async ({ page }) => {
                await page.evaluate((size) => {
                    UI.StarRating.init($.findOne('#rating'), { size, tooltip: false });
                }, size);

                const slider = page.locator('.starrating');
                await expect(slider).toHaveClass(`starrating starrating-${size}`);
                expect(await slider.evaluate((node) =>
                    Number.parseFloat(getComputedStyle(node).fontSize))).toBeCloseTo(fontSize, 1);
            });
        }
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
});
