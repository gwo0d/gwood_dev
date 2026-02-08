import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
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

export default defineConfig(() => {
	// HTML minification removed as per request
	return {
		root: '.', // root is current directory
		build: {
			outDir: 'dist',
			assetsDir: 'assets', // default
			emptyOutDir: true,
			rollupOptions: {
				input: getHtmlEntries(__dirname),
			},
		},
		plugins: [
			viteCompression({
				algorithm: 'gzip',
				ext: '.gz',
			}),
			viteCompression({
				algorithm: 'brotliCompress',
				ext: '.br',
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
	};
});
