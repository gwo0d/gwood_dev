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
