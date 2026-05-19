import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.resolve(
	__dirname,
	'../node_modules/bootstrap-icons/icons'
);
const OUTPUT_FILE = path.resolve(__dirname, '../public/icons.svg');

const USED_ICONS = [
	'bluesky',
	'github',
	'image',
	'film',
	'mortarboard-fill',
	'download',
	'hexagon',
	'hexagon-fill',
	'hexagon-half',
	'arrow-left',
];

export async function generateSprite() {
	console.log('Generating SVG sprite...');

	const symbolPromises = USED_ICONS.map(async (icon) => {
		const filePath = path.join(ICONS_DIR, `${icon}.svg`);
		try {
			const content = await fs.promises.readFile(filePath, 'utf-8');
			const $ = load(content, { xmlMode: true });
			const svg = $('svg');
			const viewBox = svg.attr('viewBox');
			const innerContent = svg.html();

			return `<symbol id="bi-${icon}" viewBox="${viewBox}">${innerContent}</symbol>`;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				console.error(`Icon not found: ${icon}`);
				return null;
			}
			throw error;
		}
	});

	const results = await Promise.all(symbolPromises);
	const symbols = results.filter((s): s is string => s !== null);

	const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
	<defs>
		${symbols.join('\n\t\t')}
	</defs>
</svg>`;

	await fs.promises.writeFile(OUTPUT_FILE, sprite);
	console.log(
		`Sprite generated at ${OUTPUT_FILE} with ${symbols.length} icons.`
	);
}

if (process.argv[1] === __filename) {
	generateSprite();
}
