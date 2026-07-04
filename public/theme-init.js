// Applies the stored (or system) colour theme before first paint to avoid a
// flash of the wrong theme. Kept as a small, standalone, render-blocking
// script in <head>. data-cfasync="false" excludes it from Cloudflare Rocket
// Loader so it always runs synchronously and early.
(() => {
	const getStoredTheme = () => {
		try {
			return window.localStorage.getItem('theme');
		} catch {
			return null;
		}
	};
	const getTargetTheme = (theme) => {
		if (theme === 'dark' || theme === 'light') return theme;
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
	};
	const storedTheme = getStoredTheme();
	const theme = storedTheme || 'auto';
	const targetTheme = getTargetTheme(theme);
	document.documentElement.setAttribute('data-bs-theme', targetTheme);
	const favicon = document.getElementById('favicon');
	if (favicon) {
		favicon.href = `/favicon-${targetTheme}.svg`;
	}
})();
