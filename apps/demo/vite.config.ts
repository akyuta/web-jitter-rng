import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    base: './', // GitHub Pages deployment
    resolve: {
        alias: {
            'web-jitter-rng': path.resolve(__dirname, '../../packages/web-jitter-rng/src/index.ts'),
        },
    },
});
