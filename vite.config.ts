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
			// Generate _headers with the SHA-256 hashes of the inline scripts
			try {
				const distDir = resolve(__dirname, 'dist');
				if (!fs.existsSync(distDir)) {
					console.warn(
						'[csp-hash-plugin] dist directory not found, skipping CSP generation.'
					);
					return;
				}

				const getHtmlFiles = (dir: string): string[] => {
					let results: string[] = [];
					const list = fs.readdirSync(dir);
					list.forEach((file) => {
						const filePath = resolve(dir, file);
						const stat = fs.statSync(filePath);
						if (stat && stat.isDirectory()) {
							results = results.concat(getHtmlFiles(filePath));
						} else if (file.endsWith('.html')) {
							results.push(filePath);
						}
					});
					return results;
				};

				const htmlFiles = getHtmlFiles(distDir);
				const hashes = new Set<string>();

				htmlFiles.forEach((filePath) => {
					const html = fs.readFileSync(filePath, 'utf-8');
					const $ = load(html);
					$('script[data-cfasync="false"]').each((_, el) => {
						const scriptContent = $(el).html();
						if (scriptContent) {
							const hash = createHash('sha256')
								.update(scriptContent)
								.digest('base64');
							hashes.add(`'sha256-${hash}'`);
						}
					});
				});

				if (hashes.size === 0) {
					console.warn(
						'[csp-hash-plugin] No target inline scripts found.'
					);
					return;
				}

				const publicHeadersPath = resolve(__dirname, 'public/_headers');
				if (!fs.existsSync(publicHeadersPath)) {
					console.warn(
						'[csp-hash-plugin] public/_headers not found.'
					);
					return;
				}

				const content = fs.readFileSync(publicHeadersPath, 'utf-8');
				const hashString = Array.from(hashes).join(' ');

				// Replace CSP: remove 'unsafe-inline' and add the hashes
				const newContent = content.replace(
					/'unsafe-inline'/g,
					(match, offset, string) => {
						// Only replace if it's part of script-src
						const lineStart = string.lastIndexOf('\n', offset) + 1;
						const line = string.substring(
							lineStart,
							string.indexOf('\n', offset)
						);
						if (line.includes('script-src')) {
							return hashString;
						}
						return match;
					}
				);

				const distHeadersPath = resolve(__dirname, 'dist/_headers');
				fs.writeFileSync(distHeadersPath, newContent);
				console.log(
					`[csp-hash-plugin] Generated _headers with ${hashes.size} unique hashes.`
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
	const isProduction = mode === 'production';
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
