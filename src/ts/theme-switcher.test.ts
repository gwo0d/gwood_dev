// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MARKUP = `
	<link rel="icon" id="favicon" href="/favicon-light.svg" />
	<button id="bd-theme"><svg class="bi"><use href=""></use></svg></button>
	<button data-bs-theme-value="light">Light</button>
	<button data-bs-theme-value="dark">Dark</button>
	<button data-bs-theme-value="auto">Auto</button>
	<button data-bs-theme-value="democratic">Democratic</button>
`;

// The module caches DOM lookups and the stored theme, so load a fresh copy
// for each test.
const loadSwitcher = async () => {
	vi.resetModules();
	return import('./theme-switcher');
};

const mockSystemTheme = (dark: boolean) => {
	vi.stubGlobal(
		'matchMedia',
		vi.fn().mockReturnValue({
			matches: dark,
			addEventListener: vi.fn(),
		})
	);
};

const appliedTheme = () =>
	document.documentElement.getAttribute('data-bs-theme');

const activeOption = () =>
	document
		.querySelector('[data-bs-theme-value].active')
		?.getAttribute('data-bs-theme-value');

describe('Theme switcher', () => {
	beforeEach(() => {
		document.body.innerHTML = MARKUP;
		document.documentElement.removeAttribute('data-bs-theme');
		window.localStorage.clear();
		mockSystemTheme(false);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('applies the default theme when nothing is stored', async () => {
		const { initThemeSwitcher, DEFAULT_THEME } = await loadSwitcher();
		initThemeSwitcher();

		expect(DEFAULT_THEME).toBe('democratic');
		expect(appliedTheme()).toBe('democratic');
		expect(activeOption()).toBe('democratic');
		expect(document.getElementById('favicon')?.getAttribute('href')).toBe(
			'/favicon-democratic.svg'
		);
		expect(
			document.getElementById('bd-theme')?.getAttribute('aria-label')
		).toBe('Theme: Democratic');
	});

	it("respects a visitor's stored choice", async () => {
		window.localStorage.setItem('theme', 'dark');
		const { initThemeSwitcher } = await loadSwitcher();
		initThemeSwitcher();

		expect(appliedTheme()).toBe('dark');
		expect(activeOption()).toBe('dark');
	});

	it('still resolves a stored "auto" from the system preference', async () => {
		window.localStorage.setItem('theme', 'auto');
		mockSystemTheme(true);
		const { initThemeSwitcher } = await loadSwitcher();
		initThemeSwitcher();

		expect(appliedTheme()).toBe('dark');
		expect(activeOption()).toBe('auto');
	});

	it('ignores an unrecognised stored value', async () => {
		window.localStorage.setItem('theme', 'sepia');
		const { initThemeSwitcher } = await loadSwitcher();
		initThemeSwitcher();

		expect(appliedTheme()).toBe('democratic');
	});

	it('switches to and stores the theme picked from the menu', async () => {
		const { initThemeSwitcher } = await loadSwitcher();
		initThemeSwitcher();

		document
			.querySelector<HTMLElement>('[data-bs-theme-value="light"]')
			?.click();
		expect(appliedTheme()).toBe('light');
		expect(window.localStorage.getItem('theme')).toBe('light');

		document
			.querySelector<HTMLElement>('[data-bs-theme-value="democratic"]')
			?.click();
		expect(appliedTheme()).toBe('democratic');
		expect(window.localStorage.getItem('theme')).toBe('democratic');
		expect(activeOption()).toBe('democratic');
	});
});
