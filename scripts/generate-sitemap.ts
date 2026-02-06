import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://gwood.dev';
const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const DIST_DIR = path.join(process.cwd(), 'dist');

interface SitemapUrl {
	loc: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
}

async function generateSitemap() {
	try {
		console.log('Starting sitemap generation...');

		const urls: SitemapUrl[] = [];
		const today = new Date().toISOString().split('T')[0];

		// Add homepage
		urls.push({
			loc: `${BASE_URL}/`,
			lastmod: today,
			changefreq: 'weekly',
			priority: 1.0,
		});

		// Add blog index
		urls.push({
			loc: `${BASE_URL}/blog/`,
			lastmod: today,
			changefreq: 'weekly',
			priority: 0.8,
		});

		// Read blog posts
		if (await fs.stat(CONTENT_DIR).catch(() => false)) {
			const files = await fs.readdir(CONTENT_DIR);
			const mdFiles = files.filter((file) => file.endsWith('.md'));

			for (const file of mdFiles) {
				const filePath = path.join(CONTENT_DIR, file);
				const fileContent = await fs.readFile(filePath, 'utf-8');
				const { data } = matter(fileContent);

				const slug = file.replace('.md', '');

                if (data.date) {
					let dateStr = data.date;
					// Ensure date is in YYYY-MM-DD format if it's a Date object
					if (data.date instanceof Date) {
						dateStr = data.date.toISOString().split('T')[0];
					}

                    urls.push({
                        loc: `${BASE_URL}/blog/${slug}`,
                        lastmod: dateStr,
                        changefreq: 'monthly',
                        priority: 0.6,
                    });
                }
			}
		}

		// Generate XML
		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map((url) => {
		return `	<url>
		<loc>${url.loc}</loc>
		<lastmod>${url.lastmod}</lastmod>
		<changefreq>${url.changefreq}</changefreq>
		<priority>${url.priority}</priority>
	</url>`;
	})
	.join('\n')}
</urlset>`;

		// Ensure dist directory exists (it should after build)
		await fs.mkdir(DIST_DIR, { recursive: true });

		await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
		console.log(`Generated sitemap at ${path.join(DIST_DIR, 'sitemap.xml')}`);

	} catch (error) {
		console.error('Error generating sitemap:', error);
		process.exit(1);
	}
}

generateSitemap();
