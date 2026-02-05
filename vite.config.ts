import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	root: '.', // root is current directory
	build: {
		outDir: 'dist',
		assetsDir: 'assets', // default
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				not_found: resolve(__dirname, '404.html'),
			},
		},
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
