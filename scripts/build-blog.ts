import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const TEMPLATE_DIR = path.join(process.cwd(), 'src/templates');
const OUTPUT_DIR = path.join(process.cwd(), 'blog');

interface BlogPost {
	slug: string;
	title: string;
	date: string;
	description: string;
	content: string; // HTML content
}

async function buildBlog() {
	try {
		console.log('Starting blog generation...');

		// Ensure output directory exists
		await fs.mkdir(OUTPUT_DIR, { recursive: true });

		// Read all markdown files
		const files = await fs.readdir(CONTENT_DIR);
		const mdFiles = files.filter((file) => file.endsWith('.md'));

		const posts: BlogPost[] = [];

		// Load templates
		const postTemplate = await fs.readFile(
			path.join(TEMPLATE_DIR, 'blog-post.html'),
			'utf-8'
		);
		const indexTemplate = await fs.readFile(
			path.join(TEMPLATE_DIR, 'blog-index.html'),
			'utf-8'
		);

		for (const file of mdFiles) {
			const filePath = path.join(CONTENT_DIR, file);
			const fileContent = await fs.readFile(filePath, 'utf-8');
			const { data, content } = matter(fileContent);

			const slug = file.replace('.md', '');
			const htmlContent = await marked.parse(content);

			posts.push({
				slug,
				title: data.title,
				date: data.date,
				description: data.description || '',
				content: htmlContent,
			});

			// Generate individual post page
			const postHtml = postTemplate
				.replace(/{{title}}/g, data.title)
				.replace(/{{date}}/g, data.date)
				.replace(/{{description}}/g, data.description || '')
				.replace('{{content}}', htmlContent);

			await fs.writeFile(path.join(OUTPUT_DIR, `${slug}.html`), postHtml);
			console.log(`Generated blog/${slug}.html`);
		}

		// Sort posts by date (newest first)
		posts.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);

		// Generate index page
		const listItems = posts
			.map(
				(post) => `
            <a href="/blog/${post.slug}.html" class="list-group-item list-group-item-action py-3 lh-tight">
                <div class="d-flex w-100 align-items-center justify-content-between">
                    <h5 class="mb-1">${post.title}</h5>
                    <small class="text-muted">${post.date}</small>
                </div>
                <p class="mb-1 small">${post.description}</p>
            </a>
        `
			)
			.join('\n');

		const indexHtml = indexTemplate.replace('{{content}}', listItems);
		await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
		console.log(`Generated blog/index.html`);

		console.log('Blog generation complete.');
	} catch (error) {
		console.error('Error building blog:', error);
		process.exit(1);
	}
}

buildBlog();
