/**
 * @jest-environment jsdom
 */

import { initThemeSwitcher } from '../src/js/theme-switcher';

describe('Theme Switcher', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="bd-theme" class="btn btn-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Toggle theme">
        <i class="bi bi-circle-half"></i>
        <span class="d-lg-none ms-2" id="bd-theme-text">Toggle theme</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="bd-theme-text">
        <li><button class="dropdown-item" type="button" data-bs-theme-value="light"><i class="bi bi-sun-fill me-2"></i>Light</button></li>
        <li><button class="dropdown-item" type="button" data-bs-theme-value="dark"><i class="bi bi-moon-stars-fill me-2"></i>Dark</button></li>
        <li><button class="dropdown-item" type="button" data-bs-theme-value="auto"><i class="bi bi-circle-half me-2"></i>Auto</button></li>
      </ul>
    `;
  });

  test('should set the initial theme based on user preference', () => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null);

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    initThemeSwitcher();

    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });
});
