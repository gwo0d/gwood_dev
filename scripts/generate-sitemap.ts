import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const BASE_URL = 'https://gwood.dev';
const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const DIST_DIR = path.join(process.cwd(), 'dist');

interface SitemapUrl {
	loc: string;
	lastmod?: string;
	changefreq?:
		| 'always'
		| 'hourly'
		| 'daily'
		| 'weekly'
		| 'monthly'
		| 'yearly'
		| 'never';
	priority?: number;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function toDateString(date: unknown): string | undefined {
	if (date instanceof Date) {
		return date.toISOString().split('T')[0];
	}
	if (typeof date === 'string' && date.trim() !== '') {
		return date;
	}
	return undefined;
}

async function generateSitemap() {
	try {
		console.log('Starting sitemap generation...');

		// Read blog posts first so page-level lastmod values can be derived from
		// real content dates rather than the build timestamp.
		const blogPosts: { slug: string; date?: string }[] = [];
		if (await fs.stat(CONTENT_DIR).catch(() => false)) {
			const files = await fs.readdir(CONTENT_DIR);
			const mdFiles = files.filter((file) => file.endsWith('.md'));

			const parsed = await Promise.all(
				mdFiles.map(async (file) => {
					const filePath = path.join(CONTENT_DIR, file);
					const fileContent = await fs.readFile(filePath, 'utf-8');
					const { data } = matter(fileContent);
					const slug = file.replace('.md', '');
					return { slug, date: toDateString(data.date) };
				})
			);
			blogPosts.push(...parsed);
		}

		const postDates = blogPosts
			.map((p) => p.date)
			.filter((d): d is string => Boolean(d))
			.sort();
		const latestPostDate = postDates[postDates.length - 1];

		const urls: SitemapUrl[] = [];

		// Homepage: static, so no reliable content-modification date to report.
		urls.push({
			loc: `${BASE_URL}/`,
			changefreq: 'weekly',
			priority: 1.0,
		});

		// Blog index changes when a new post is published, so date it from the
		// most recent post.
		urls.push({
			loc: `${BASE_URL}/blog/`,
			lastmod: latestPostDate,
			changefreq: 'weekly',
			priority: 0.8,
		});

		for (const { slug, date } of blogPosts) {
			if (date) {
				urls.push({
					loc: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
					lastmod: date,
					changefreq: 'monthly',
					priority: 0.6,
				});
			}
		}

		// Generate XML
		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map((url) => {
		const parts = [`		<loc>${escapeXml(url.loc)}</loc>`];
		if (url.lastmod) parts.push(`		<lastmod>${url.lastmod}</lastmod>`);
		if (url.changefreq)
			parts.push(`		<changefreq>${url.changefreq}</changefreq>`);
		if (url.priority !== undefined)
			parts.push(`		<priority>${url.priority}</priority>`);
		return `	<url>\n${parts.join('\n')}\n	</url>`;
	})
	.join('\n')}
</urlset>`;

		// Ensure dist directory exists (it should after build)
		await fs.mkdir(DIST_DIR, { recursive: true });

		await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
		console.log(
			`Generated sitemap at ${path.join(DIST_DIR, 'sitemap.xml')}`
		);
	} catch (error) {
		console.error('Error generating sitemap:', error);
		process.exit(1);
	}
}

generateSitemap();
