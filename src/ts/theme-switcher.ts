/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2025 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

type Theme = 'light' | 'dark' | 'auto';

const getStoredTheme = (): Theme | null =>
  localStorage.getItem('theme') as Theme | null;
const setStoredTheme = (theme: Theme): void =>
  localStorage.setItem('theme', theme);

const getPreferredTheme = (): Exclude<Theme, 'auto'> => {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const setTheme = (theme: Theme): void => {
  if (theme === 'auto') {
    document.documentElement.setAttribute(
      'data-bs-theme',
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    );
  } else {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
};

const showActiveTheme = (theme: Theme, focus = false): void => {
  const themeSwitcher = document.querySelector(
    '#bd-theme'
  ) as HTMLElement | null;
  if (!themeSwitcher) return;

  const themeSwitcherText = document.querySelector('#bd-theme-text');
  const btnToActive = document.querySelector(
    `[data-bs-theme-value="${theme}"]`
  ) as HTMLElement | null;
  if (!btnToActive) return;

  document
    .querySelectorAll<HTMLElement>('[data-bs-theme-value]')
    .forEach((el) => {
      el.classList.remove('active');
      el.setAttribute('aria-pressed', 'false');
    });
  btnToActive.classList.add('active');
  btnToActive.setAttribute('aria-pressed', 'true');

  const activeIcon = btnToActive.querySelector('i');
  const switcherIcon = themeSwitcher.querySelector('i');
  if (activeIcon && switcherIcon) {
    (switcherIcon as HTMLElement).className = (
      activeIcon as HTMLElement
    ).className;
  }

  if (themeSwitcherText) {
    const themeSwitcherLabel = `${themeSwitcherText.textContent} (${(btnToActive.dataset as DOMStringMap).bsThemeValue})`;
    themeSwitcher.setAttribute('aria-label', themeSwitcherLabel);
  }

  if (focus) themeSwitcher.focus();
};

const initThemeSwitcher = (): void => {
  setTheme(getPreferredTheme());
  showActiveTheme(getPreferredTheme());

  document
    .querySelectorAll<HTMLElement>('[data-bs-theme-value]')
    .forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-bs-theme-value') as Theme;
        if (!theme) return;
        setStoredTheme(theme);
        setTheme(theme);
        showActiveTheme(theme, true);
      });
    });

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const storedTheme = getStoredTheme();
      if (storedTheme !== 'light' && storedTheme !== 'dark') {
        setTheme(getPreferredTheme());
      }
    });
};

export { initThemeSwitcher };
