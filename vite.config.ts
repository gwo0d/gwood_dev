import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { randomBytes } from 'crypto';
import fs from 'fs';
import { load } from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Custom plugin to inject nonces and generate CSP headers
const nonceCspPlugin = () => {
	const nonce = randomBytes(16).toString('base64');

	return {
		name: 'nonce-csp-plugin',
		transformIndexHtml(html: string) {
			const $ = load(html);
			$('script, style').attr('nonce', nonce);
			return $.html();
		},
		closeBundle() {
			try {
				const publicHeadersPath = resolve(
					__dirname,
					'public/_headers.template'
				);
				if (!fs.existsSync(publicHeadersPath)) {
					console.warn(
						'[nonce-csp-plugin] public/_headers.template not found.'
					);
					return;
				}

				const content = fs.readFileSync(publicHeadersPath, 'utf-8');
				const newContent = content.replace(
					/Content-Security-Policy:(.*)/g,
					(match, cspValue) => {
						const directives = cspValue
							.split(';')
							.map((d: string) => d.trim())
							.filter((d: string) => d.length > 0);

						const newDirectives = directives.map((directive: string) => {
							if (directive.startsWith('script-src')) {
								return `${directive} 'nonce-${nonce}'`;
							}
							if (directive.startsWith('style-src')) {
								// Check if it's strictly 'style-src' and not 'style-src-attr'
								// verify by checking the directive name
								const parts = directive.split(/\s+/);
								if (parts[0] === 'style-src') {
									return `${directive} 'nonce-${nonce}'`;
								}
							}
							return directive;
						});

						// Ensure style-src-attr 'unsafe-inline' exists
						const hasStyleSrcAttr = newDirectives.some((d: string) =>
							d.startsWith('style-src-attr')
						);
						if (!hasStyleSrcAttr) {
							newDirectives.push("style-src-attr 'unsafe-inline'");
						}

						return `Content-Security-Policy: ${newDirectives.join('; ')}`;
					}
				);

				const distDir = resolve(__dirname, 'dist');
				if (!fs.existsSync(distDir)) {
					fs.mkdirSync(distDir, { recursive: true });
				}

				const distHeadersPath = resolve(distDir, '_headers');
				fs.writeFileSync(distHeadersPath, newContent);
				console.log(
					`[nonce-csp-plugin] Generated _headers with nonce: ${nonce}`
				);
			} catch (e) {
				console.error(
					'[nonce-csp-plugin] Failed to generate _headers:',
					e
				);
			}
		},
	};
};

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

export default defineConfig(({ mode }) => {
	// const isProduction = mode === 'production';
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
			nonceCspPlugin(),
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
