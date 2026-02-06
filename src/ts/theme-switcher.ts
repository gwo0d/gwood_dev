/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2025 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

// Define a type for the possible theme values for better type-checking.
type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'theme';

// Fallback memory store in case localStorage is unavailable (private mode, blocked, etc.)
let memoryTheme: Theme | null = null;

const isValidTheme = (value: unknown): value is Theme =>
	value === 'light' || value === 'dark' || value === 'auto';

const getStoredTheme = (): Theme | null => {
	try {
		const value = window.localStorage.getItem(STORAGE_KEY);
		return isValidTheme(value) ? value : null;
	} catch {
		return memoryTheme;
	}
};

const setStoredTheme = (theme: Theme): void => {
	try {
		window.localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		memoryTheme = theme;
	}
};

// If nothing stored, prefer "auto" so the UI highlights Auto by default while honouring OS preference.
const getPreferredTheme = (): Theme => {
	const storedTheme = getStoredTheme();
	return storedTheme ?? 'auto';
};

const getSystemTheme = (): Exclude<Theme, 'auto'> =>
	window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';

const setTheme = (theme: Theme): void => {
	const target = theme === 'auto' ? getSystemTheme() : theme;
	const current = document.documentElement.getAttribute('data-bs-theme');
	if (current !== target) {
		document.documentElement.setAttribute('data-bs-theme', target);
	}
	const favicon = document.getElementById(
		'favicon'
	) as HTMLLinkElement | null;
	if (favicon) {
		favicon.href = `/favicon-${target}.svg`;
	}
};

// Module-level cache variables to avoid repeated DOM queries
let cachedThemeSwitcherBtn: HTMLButtonElement | null = null;
let cachedThemeSwitcherBtnIcon: HTMLElement | null = null;
let cachedThemeBtns: HTMLElement[] | null = null;
const cachedThemeBtnMap = new Map<Theme, HTMLElement>();

// Sync the dropdown UI and the trigger button's icon/label.
const showActiveTheme = (theme: Theme, focus: boolean = false): void => {
	// Initialize cache lazily
	if (!cachedThemeSwitcherBtn) {
		cachedThemeSwitcherBtn =
			document.querySelector<HTMLButtonElement>('#bd-theme');
		if (cachedThemeSwitcherBtn) {
			cachedThemeSwitcherBtnIcon =
				cachedThemeSwitcherBtn.querySelector<HTMLElement>('.bi');
		}
	}

	if (!cachedThemeBtns) {
		cachedThemeBtns = Array.from(
			document.querySelectorAll<HTMLElement>('[data-bs-theme-value]')
		);
		cachedThemeBtns.forEach((btn) => {
			const val = btn.getAttribute('data-bs-theme-value');
			if (isValidTheme(val)) {
				cachedThemeBtnMap.set(val, btn);
			}
		});
	}

	const switcherBtn = cachedThemeSwitcherBtn;
	const switcherIcon = cachedThemeSwitcherBtnIcon;

	const themeSafe: Theme = isValidTheme(theme) ? theme : 'auto';
	const btnToActivate = cachedThemeBtnMap.get(themeSafe);

	if (!switcherBtn || !btnToActivate) return;

	// Update active state for menu items
	cachedThemeBtns?.forEach((el) => {
		el.classList.remove('active');
		el.setAttribute('aria-pressed', 'false');
	});
	btnToActivate.classList.add('active');
	btnToActivate.setAttribute('aria-pressed', 'true');

	// Update the trigger button icon to match the chosen theme.
	if (switcherIcon) {
		const iconMap: Record<Theme, string> = {
			light: 'bi-hexagon',
			dark: 'bi-hexagon-fill',
			auto: 'bi-hexagon-half',
		};
		const use = switcherIcon.querySelector('use');
		if (use) {
			use.setAttribute('href', `/icons.svg#${iconMap[themeSafe]}`);
		}
	}

	// Remove any previously-added visible label.
	const existingLabel = switcherBtn.querySelector<HTMLSpanElement>(
		'span[data-theme-label]'
	);
	if (existingLabel) existingLabel.remove();

	// Make the trigger accessible with a clear aria-label.
	const labelMap: Record<Theme, string> = {
		light: 'Theme: Light',
		dark: 'Theme: Dark',
		auto: 'Theme: Auto (follows system)',
	};
	switcherBtn.setAttribute('aria-label', labelMap[themeSafe]);

	// Also provide an SR-only label inside the button (redundant but safe)
	const getOrCreateSrLabel = (): HTMLSpanElement => {
		let span = switcherBtn.querySelector<HTMLSpanElement>(
			'span[data-theme-sr-label]'
		);
		if (!span) {
			span = document.createElement('span');
			span.setAttribute('data-theme-sr-label', '');
			span.className = 'visually-hidden';
			switcherBtn.appendChild(span);
		}
		return span;
	};
	getOrCreateSrLabel().textContent = labelMap[themeSafe];

	if (focus) switcherBtn.focus();
};

export function initThemeSwitcher(): void {
	// Guard against environments without a DOM (SSR/build-time execution safety)
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return;
	}

	// Respond to OS theme changes only when using Auto (or when nothing explicit is stored).
	window
		.matchMedia('(prefers-color-scheme: dark)')
		.addEventListener('change', () => {
			const stored = getStoredTheme();
			if (!stored || stored === 'auto') {
				setTheme('auto');
				showActiveTheme('auto');
			}
		});

	// Sync across tabs/windows when localStorage changes
	window.addEventListener('storage', (ev: StorageEvent) => {
		if (ev.key !== STORAGE_KEY) return;
		const next = isValidTheme(ev.newValue) ? ev.newValue : 'auto';
		setTheme(next);
		showActiveTheme(next);
	});

	const init = (): void => {
		const currentTheme = getPreferredTheme();
		// Ensure the theme is correctly applied (in case head script was missed or for late-loading sync)
		setTheme(currentTheme);
		showActiveTheme(currentTheme);

		document
			.querySelectorAll<HTMLElement>('[data-bs-theme-value]')
			.forEach((toggle) => {
				toggle.addEventListener('click', () => {
					const themeValue = toggle.getAttribute(
						'data-bs-theme-value'
					);
					if (!isValidTheme(themeValue)) return;
					const theme = themeValue as Theme;
					setStoredTheme(theme);
					setTheme(theme);
					showActiveTheme(theme, true);
				});
			});
	};

	if (document.readyState === 'loading') {
		window.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
}
