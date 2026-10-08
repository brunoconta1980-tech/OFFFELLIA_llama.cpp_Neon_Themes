import { defineConfig } from '@vite-pwa/assets-generator/config';

// Favicon and SVG image generation is disabled. This config stays so an old
// command that still points at it does not read or rewrite those files.
export default defineConfig({
	headLinkOptions: {
		preset: '2023'
	},
	images: [],
	preset: {
		apple: {
			sizes: []
		},
		maskable: {
			sizes: []
		},
		transparent: {
			sizes: []
		}
	}
});
