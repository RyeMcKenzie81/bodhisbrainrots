export function toggleFullscreen() {
    if (!document.fullscreenElement &&    // Standard
        !document.webkitFullscreenElement && // Webkit
        !document.mozFullScreenElement && // Firefox
        !document.msFullscreenElement) {  // IE/Edge

        // Enter Fullscreen
        const de = document.documentElement;
        if (de.requestFullscreen) {
            de.requestFullscreen();
        } else if (de.webkitRequestFullscreen) {
            de.webkitRequestFullscreen();
        } else if (de.mozRequestFullScreen) {
            de.mozRequestFullScreen();
        } else if (de.msRequestFullscreen) {
            de.msRequestFullscreen();
        }
    } else {
        // Exit Fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}
