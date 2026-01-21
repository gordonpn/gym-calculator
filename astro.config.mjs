import alpinejs from '@astrojs/alpinejs';
import { defineConfig } from 'astro/config';

export default defineConfig({
    integrations: [
        alpinejs({
            entrypoint: '/src/alpine.ts',
        }),
    ],
});
