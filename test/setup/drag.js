/**
 * Dispatches a mouse or synthetic touch event in the browser for the rating slider.
 * @param {object} options The event options.
 * @param {'mouse'|'touch'} options.pointer The pointer type.
 * @param {'start'|'move'|'end'} options.phase The drag phase.
 * @param {number} options.fraction The horizontal position as a fraction of the slider width.
 */
export function dispatchDragEvent({ pointer, phase, fraction }) {
    const slider = document.querySelector('.starrating');
    const rect = slider.getBoundingClientRect();
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
}
