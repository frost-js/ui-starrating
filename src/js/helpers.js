/**
 * Gets the number of decimal places represented by a finite number.
 * @param {number} value The number to inspect.
 * @returns {number} The number of decimal places.
 */
export function getDecimalPlaces(value) {
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
export function parseNumber(value, fallback) {
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
