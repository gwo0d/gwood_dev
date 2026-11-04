// Applies the stored (or system) colour theme before first paint to avoid a
// flash of the wrong theme. Kept as a small, standalone, render-blocking
// script in <head>. data-cfasync="false" excludes it from Cloudflare Rocket
// Loader so it always runs synchronously and early.
(() => {
	// Temporary: the 'democratic' celebration theme is the default for visitors
	// who have not picked a theme. Keep in sync with DEFAULT_THEME in
	// src/ts/theme-switcher.ts (normally 'auto').
	const DEFAULT_THEME = 'democratic';
	const THEMES = ['light', 'dark', 'auto', 'democratic'];
	const getStoredTheme = () => {
		try {
			return window.localStorage.getItem('theme');
		} catch {
			return null;
		}
	};
	const getTargetTheme = (theme) => {
		if (theme !== 'auto') return theme;
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
	};
	const storedTheme = getStoredTheme();
	const theme = THEMES.includes(storedTheme) ? storedTheme : DEFAULT_THEME;
	const targetTheme = getTargetTheme(theme);
	document.documentElement.setAttribute('data-bs-theme', targetTheme);
	const favicon = document.getElementById('favicon');
	if (favicon) {
		favicon.href = `/favicon-${targetTheme}.svg`;
	}
})();
