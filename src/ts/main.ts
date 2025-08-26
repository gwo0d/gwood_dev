// Import Custom CSS
import '../scss/styles.scss';

// Import Bootstrap’s JS
// import 'bootstrap/js/dist/alert.js';
import 'bootstrap/js/dist/button.js';
// import 'bootstrap/js/dist/carousel.js';
// import 'bootstrap/js/dist/collapse.js';
import 'bootstrap/js/dist/dropdown.js';
import 'bootstrap/js/dist/modal.js';
// import 'bootstrap/js/dist/offcanvas.js';
// import 'bootstrap/js/dist/popover.js';
// import 'bootstrap/js/dist/scrollspy.js';
// import 'bootstrap/js/dist/tab.js';
// import 'bootstrap/js/dist/toast.js';
import Tooltip from 'bootstrap/js/dist/tooltip.js';
import './photography';
import './theme-switcher';

// Enable Tooltips
document
	.querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]')
	.forEach((tooltip) => {
		// eslint-disable-next-line no-new
		new Tooltip(tooltip);
	});
