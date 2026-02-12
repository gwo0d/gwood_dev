// Import Custom CSS
import '../scss/styles.scss';

// Import Bootstrap’s JS
import 'bootstrap/js/dist/dropdown.js';
import 'bootstrap/js/dist/modal.js';
import Tooltip from 'bootstrap/js/dist/tooltip.js';
import { initThemeSwitcher } from './theme-switcher';

// Initialize modules
initThemeSwitcher();

// Interactive lazy load photography module
let photographyPromise: Promise<void> | null = null;
const loadPhotography = () => {
	if (!photographyPromise) {
		photographyPromise = import('./photography').then(
			({ initPhotography }) => {
				initPhotography();
			}
		);
	}
	return photographyPromise;
};

// Find the modal trigger and attach listeners for preloading
const trigger = document.querySelector('[data-bs-target="#ppModal"]');
if (trigger) {
	// Preload on hover or focus
	trigger.addEventListener('mouseenter', loadPhotography, { once: true });
	trigger.addEventListener('focus', loadPhotography, { once: true });
	// Ensure it loads on click if hover was missed
	trigger.addEventListener('click', loadPhotography, { once: true });
}

// Fallback: Listen for the modal opening event globally to ensure logic runs
document.addEventListener('show.bs.modal', (e) => {
	if ((e.target as HTMLElement).id === 'ppModal') {
		loadPhotography();
	}
});

// Enable Tooltips (Lazy Initialization)
const initTooltip = (event: Event) => {
	const target = event.target as Element;
	if (!target || !target.closest) return;

	const tooltipTarget = target.closest(
		'[data-bs-toggle="tooltip"]'
	) as HTMLElement;

	if (tooltipTarget && !Tooltip.getInstance(tooltipTarget)) {
		const tooltip = new Tooltip(tooltipTarget);
		tooltip.show();
	}
};

document.body.addEventListener('mouseover', initTooltip);
document.body.addEventListener('focusin', initTooltip);
