import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: {
        exclude: ['kaboom']
    },
    build: {
        minify: false // Disable minification to debug better if it fails again
    }
});
