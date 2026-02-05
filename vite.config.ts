import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { createHash } from 'crypto';
import fs from 'fs';
import { load } from 'cheerio';
import { minify } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Custom plugin to minify HTML and generate CSP hash for the inline script
const cspPlugin = ({ minifyHtml }: { minifyHtml: boolean }) => {
	return {
		name: 'csp-hash-plugin',
		async transformIndexHtml(html: string) {
			// Minify HTML if in production
			if (minifyHtml) {
				const minifiedHtml = await minify(html, {
					collapseWhitespace: true,
					removeComments: true,
					minifyJS: true,
					minifyCSS: true,
				});
				return minifiedHtml;
			}
			return html;
		},
		closeBundle() {
			// Generate _headers with the SHA-256 hash of the inline script
			try {
				const distIndexPath = resolve(__dirname, 'dist/index.html');
				if (!fs.existsSync(distIndexPath)) {
					console.warn(
						'[csp-hash-plugin] dist/index.html not found, skipping CSP generation.'
					);
					return;
				}

				const html = fs.readFileSync(distIndexPath, 'utf-8');
				const $ = load(html);
				const scriptContent = $('script[data-cfasync="false"]').html();

				if (!scriptContent) {
					console.warn(
						'[csp-hash-plugin] Target inline script not found.'
					);
					return;
				}

				const hash = createHash('sha256')
					.update(scriptContent)
					.digest('base64');

				const publicHeadersPath = resolve(__dirname, 'public/_headers');
				const content = fs.readFileSync(publicHeadersPath, 'utf-8');

				// Replace CSP: remove 'unsafe-inline' and add the hash
				const newContent = content.replace(
					/script-src 'self' 'unsafe-inline'/,
					`script-src 'self' 'sha256-${hash}'`
				);

				const distHeadersPath = resolve(__dirname, 'dist/_headers');
				fs.writeFileSync(distHeadersPath, newContent);
				console.log(
					`[csp-hash-plugin] Generated _headers with hash: sha256-${hash}`
				);
			} catch (e) {
				console.error(
					'[csp-hash-plugin] Failed to generate _headers:',
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
