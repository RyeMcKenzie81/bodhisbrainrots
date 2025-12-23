/**
 * Touch Utilities for Mobile
 * Handles coordinate translation from screen space to game space
 * when using manual canvas scaling.
 */

/**
 * Convert a touch event's coordinates to game coordinates (960x744)
 * @param {Touch} touch - The touch object from a touch event
 * @returns {{x: number, y: number}} Game coordinates
 */
export function touchToGameCoords(touch) {
    const canvas = document.querySelector("canvas");
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const gameX = ((touch.clientX - rect.left) / rect.width) * 960;
    const gameY = ((touch.clientY - rect.top) / rect.height) * 744;
    return { x: gameX, y: gameY };
}

/**
 * Check if a point is inside a rectangular area (centered anchor)
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} cx - Center X of rect
 * @param {number} cy - Center Y of rect
 * @param {number} w - Width of rect
 * @param {number} h - Height of rect
 * @returns {boolean}
 */
export function pointInRect(px, py, cx, cy, w, h) {
    return px >= cx - w / 2 && px <= cx + w / 2 &&
        py >= cy - h / 2 && py <= cy + h / 2;
}

/**
 * Setup native touch handler for a scene with clickable areas
 * @param {Array<{x: number, y: number, w: number, h: number, action: Function}>} buttons
 * @returns {Function} Cleanup function to remove listener
 */
export function setupMenuTouch(buttons) {
    const canvas = document.querySelector("canvas");
    if (!canvas) return () => { };

    function handleTouchEnd(e) {
        if (e.changedTouches.length === 0) return;

        const pos = touchToGameCoords(e.changedTouches[0]);

        for (const btn of buttons) {
            if (pointInRect(pos.x, pos.y, btn.x, btn.y, btn.w, btn.h)) {
                btn.action();
                break; // Only trigger one button
            }
        }
    }

    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Return cleanup function
    return () => canvas.removeEventListener("touchend", handleTouchEnd);
}
