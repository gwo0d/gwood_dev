import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
	root: '.', // root is current directory
	build: {
		outDir: 'dist',
		assetsDir: 'assets', // default
		emptyOutDir: true,
	},
	plugins: [
		viteCompression({
			algorithm: 'gzip',
			ext: '.gz',
		}),
	],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
				silenceDeprecations: [
					'color-functions',
					'global-builtin',
					'import',
					'legacy-js-api',
					'if-function',
				],
			},
		},
	},
});
