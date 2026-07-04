import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getHtmlEntries = (rootDir: string) => {
	const entries: Record<string, string> = {
		main: resolve(rootDir, 'index.html'),
		not_found: resolve(rootDir, '404.html'),
	};

	const blogDir = resolve(rootDir, 'blog');
	if (fs.existsSync(blogDir)) {
		const files = fs.readdirSync(blogDir);
		files.forEach((file) => {
			if (file.endsWith('.html')) {
				const name = `blog/${file.replace('.html', '')}`;
				entries[name] = resolve(blogDir, file);
			}
		});
	}
	return entries;
};

export default defineConfig({
	root: '.', // root is current directory
	build: {
		outDir: 'dist',
		assetsDir: 'assets', // default
		emptyOutDir: true,
		// Never inline font files as data: URIs. Inlined fonts would be blocked
		// by the strict `font-src 'self'` CSP; keeping them as first-party files
		// lets every subset load. Other assets keep the default size threshold.
		assetsInlineLimit: (filePath) =>
			/\.(woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
		rollupOptions: {
			input: getHtmlEntries(__dirname),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
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
