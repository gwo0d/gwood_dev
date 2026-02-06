import purgecss from '@fullhuman/postcss-purgecss';
import autoprefixer from 'autoprefixer';

export default {
	plugins: [
		purgecss({
			content: [
				'./index.html',
				'./404.html',
				'./src/**/*.html',
				'./src/**/*.ts',
				'./src/**/*.js',
				'./blog/**/*.html',
			],
			safelist: {
				standard: [
					// Bootstrap dynamic classes
					/^modal-/,
					/^fade/,
					/^show/,
					/^collapsing/,
					/^tooltip/,
					/^popover/,
					/^dropdown/,
					/^bs-tooltip/,
					/^bs-popover/,
					'active',
					'collapsed',

					// Photography gallery
					'overlay',
					'rounded',
					'pp-tile',
					'pp-img',
				],
				deep: [
					// Ensure tooltip/popover structure is preserved
					/^tooltip-/,
					/^popover-/,
				],
				greedy: [],
				keyframes: true,
				variables: true,
			},
		}),
		autoprefixer(),
	],
};
