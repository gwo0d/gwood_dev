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
	'mortarboard-fill',
	'download',
	'hexagon',
	'hexagon-fill',
	'hexagon-half',
	'arrow-left',
];

async function generateSprite() {
	console.log('Generating SVG sprite...');
	const symbols: string[] = [];

	for (const icon of USED_ICONS) {
		const filePath = path.join(ICONS_DIR, `${icon}.svg`);
		if (!fs.existsSync(filePath)) {
			console.error(`Icon not found: ${icon}`);
			continue;
		}

		const content = fs.readFileSync(filePath, 'utf-8');
		const $ = load(content, { xmlMode: true });
		const svg = $('svg');
		const viewBox = svg.attr('viewBox');
		const innerContent = svg.html();

		symbols.push(
			`<symbol id="bi-${icon}" viewBox="${viewBox}">${innerContent}</symbol>`
		);
	}

	const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
	<defs>
		${symbols.join('\n\t\t')}
	</defs>
</svg>`;

	fs.writeFileSync(OUTPUT_FILE, sprite);
	console.log(
		`Sprite generated at ${OUTPUT_FILE} with ${symbols.length} icons.`
	);
}

generateSprite();
