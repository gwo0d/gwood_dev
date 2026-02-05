import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { randomBytes } from 'crypto';
import fs from 'fs';
import { load } from 'cheerio';
import { minify } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a build-time nonce
const nonce = randomBytes(16).toString('base64');

// Custom plugin to inject nonce and generate _headers
const cspPlugin = ({ minifyHtml }: { minifyHtml: boolean }) => {
	return {
		name: 'csp-nonce-plugin',
		async transformIndexHtml(html: string) {
			const $ = load(html);
			$('script[data-cfasync="false"]').attr('nonce', nonce);
			const modifiedHtml = $.html();

			if (minifyHtml) {
				const minifiedHtml = await minify(modifiedHtml, {
					collapseWhitespace: true,
					removeComments: true,
					minifyJS: true,
					minifyCSS: true,
				});

				return minifiedHtml;
			}

			return modifiedHtml;
		},
		closeBundle() {
			// Generate _headers with the nonce
			try {
				const publicHeadersPath = resolve(__dirname, 'public/_headers');
				const content = fs.readFileSync(publicHeadersPath, 'utf-8');

				// Replace CSP: remove 'unsafe-inline' from script-src and add nonce
				const newContent = content.replace(
					/script-src 'self' 'unsafe-inline'/,
					`script-src 'self' 'nonce-${nonce}'`
				);

				const distHeadersPath = resolve(__dirname, 'dist/_headers');
				fs.writeFileSync(distHeadersPath, newContent);
				console.log(
					`[csp-nonce-plugin] Generated _headers with nonce: ${nonce}`
				);
			} catch (e) {
				console.error(
					'[csp-nonce-plugin] Failed to generate _headers:',
					e
				);
			}
		},
	};
};

export default defineConfig(({ mode }) => {
	const isProduction = mode === 'production';
	return {
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
			cspPlugin({ minifyHtml: isProduction }),
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
