// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to declare variables that need to be available in the mock factory
const { searchPostsMock } = vi.hoisted(() => {
	return { searchPostsMock: vi.fn() };
});

vi.mock('@atproto/api', () => {
	return {
		AtpAgent: class {
			app = {
				bsky: {
					feed: {
						searchPosts: searchPostsMock,
					},
				},
			};
		},
	};
});

// Import AFTER mocking
import { initPhotography } from './photography';

describe('Photography Gallery', () => {
	let modal: HTMLElement;

	beforeEach(() => {
		// Reset DOM
		document.body.innerHTML = `
      <div id="ppModal" class="modal fade" style="display: none;">
        <div class="modal-content">
            <div class="modal-body">
                <div id="ppGalleryStatus"></div>
                <div id="ppGallery"></div>
            </div>
        </div>
      </div>
    `;
		modal = document.getElementById('ppModal')!;

		// Reset Mocks
		searchPostsMock.mockReset();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('should not fetch multiple times (fix validation)', async () => {
		// Mock the API response promise
		let resolveSearch: (value: unknown) => void;
		const searchPromise = new Promise((resolve) => {
			resolveSearch = resolve;
		});

		searchPostsMock.mockReturnValue(searchPromise);

		// Initialize the module
		initPhotography();

		// Simulate multiple triggers
		// 1. Trigger via event listener (modal show)
		const event = new Event('show.bs.modal', { bubbles: true });
		Object.defineProperty(event, 'target', { value: modal });

		// Trigger 1
		document.dispatchEvent(event);

		// Trigger 2 (immediately after)
		document.dispatchEvent(event);

		// Trigger 3 (via timer checkAndLoad)
		vi.advanceTimersByTime(200);

		// Resolve the promise now
		resolveSearch!({
			success: true,
			data: {
				posts: [
					{
						uri: 'at://did:plc:123/app.bsky.feed.post/1',
						author: { handle: 'test.bsky.social' },
						record: {
							$type: 'app.bsky.feed.post',
							text: 'Test Photo 1',
							createdAt: '2023-01-01T00:00:00Z',
						},
						embed: {
							$type: 'app.bsky.embed.images#view',
							images: [
								{
									fullsize: 'http://example.com/1.jpg',
									thumb: 'http://example.com/1s.jpg',
									alt: 'Alt text',
								},
							],
						},
					},
				],
				cursor: undefined,
			},
		});

		// Wait for promise chain to resolve
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		// Expectation: WITHOUT THE FIX, this should be called multiple times.
		// WITH THE FIX, this should be called exactly once.
		console.log(`Fetch called ${searchPostsMock.mock.calls.length} times`);

		expect(searchPostsMock).toHaveBeenCalledTimes(1);
	});
});
