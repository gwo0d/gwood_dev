// Import Custom CSS
import '../scss/styles.scss';

// Import Bootstrap’s JS
import 'bootstrap/js/dist/button.js';
import 'bootstrap/js/dist/dropdown.js';
import 'bootstrap/js/dist/modal.js';
import Tooltip from 'bootstrap/js/dist/tooltip.js';
import { initThemeSwitcher } from './theme-switcher';

// Initialize modules
initThemeSwitcher();

// Lazy load photography module to reduce initial bundle size
import('./photography').then(({ initPhotography }) => {
	initPhotography();
});

// Enable Tooltips
document
	.querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]')
	.forEach((tooltip) => {
		new Tooltip(tooltip);
	});
