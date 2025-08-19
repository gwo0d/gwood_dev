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

// Enable Tooltips
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltip) => {
  new Tooltip(tooltip);
});

import 'bsky-embed/dist/bsky-embed.es.js';

import { initThemeSwitcher } from './theme-switcher.js';

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initThemeSwitcher);
} else {
  initThemeSwitcher();
}
