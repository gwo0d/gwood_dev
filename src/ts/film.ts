import { AtpAgent, AppBskyFeedDefs } from '@atproto/api';
import { PhotoPost, toPhotoPost } from './photography';

const agent = new AtpAgent({ service: 'https://api.bsky.app' });

const FILM_STOCKS = [
	{ name: 'Kodak Gold 200', tag: '#KodakGold200' },
	{ name: 'Kodak Portra 400', tag: '#Portra400' },
	{ name: 'Ilford HP5 Plus', tag: '#IlfordHP5' },
	{ name: 'Fujifilm Superia X-TRA 400', tag: '#SuperiaXTRA400' },
	{ name: 'Kodak Tri-X 400', tag: '#TriX400' },
];

let currentTag: string | null = null;
let currentCursor: string | undefined = undefined;
let isLoading = false;
let hasMore = true;
const fetchedUris = new Set<string>();

const modalId = 'filmModal';
let uiInitialized = false;

async function fetchFilmPosts(tag: string, cursor?: string) {
	try {
		const res = await agent.app.bsky.feed.searchPosts({
			q: tag,
			limit: 50,
			sort: 'top',
			cursor: cursor,
		});

		if (!res.success) throw new Error('Error fetching Bluesky posts.');
		const posts = res.data.posts as AppBskyFeedDefs.PostView[];

		const photoPosts: PhotoPost[] = [];
		for (const post of posts || []) {
			const photoPost = toPhotoPost(post);
			if (photoPost.images.length > 0) {
				photoPosts.push(photoPost);
			}
		}

		return {
			cursor: res.data.cursor,
			photoPosts,
			raw: res.data,
		};
	} catch (error) {
		console.error('Failed to fetch film posts:', error);
		throw error;
	}
}

function renderGallery(photos: PhotoPost[], append: boolean = false) {
	const gallery = document.getElementById('filmGallery');
	const status = document.getElementById('filmGalleryStatus');
	const loadMoreContainer = document.getElementById('filmLoadMoreContainer');

	if (!gallery) return;

	if (!append) {
		gallery.innerHTML = '';
		fetchedUris.clear();
	}

	if (status) status.classList.add('d-none');

	if (photos.length === 0 && !append) {
		if (status) {
			status.classList.remove('d-none');
			status.innerHTML = `<div class="col-12 text-center text-body-secondary"><p>No photos found for this film stock.</p></div>`;
		}
		if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
		return;
	}

	const frag = document.createDocumentFragment();

	let newPhotosCount = 0;

	for (const post of photos) {
		if (fetchedUris.has(post.postUri)) continue;
		fetchedUris.add(post.postUri);
		newPhotosCount++;

		const postId = post.postUri.split('/').pop();
		const bskyUrl = `https://bsky.app/profile/${post.authorHandle}/post/${postId}`;

		for (const img of post.images) {
			const col = document.createElement('div');
			col.className = 'col';

			const figure = document.createElement('figure');
			figure.className = 'figure m-0 position-relative pp-tile';
			figure.setAttribute('data-post-uri', post.postUri);

			const image = document.createElement('img');
			image.className = 'figure-img img-fluid rounded shadow-sm pp-img';
			image.loading = 'lazy';
			image.alt =
				img.alt ||
				post.text ||
				`BlueSky post tagged with ${currentTag}`;
			image.src = img.thumb || img.fullsize;

			figure.appendChild(image);

			const overlay = document.createElement('button');
			overlay.type = 'button';
			overlay.className = 'overlay rounded';
			const ariaLabel =
				img.alt?.trim() ||
				post.text?.trim() ||
				`Open BlueSky post tagged with ${currentTag}`;
			overlay.setAttribute('aria-label', ariaLabel);
			overlay.setAttribute('data-bsky-url', bskyUrl);

			figure.appendChild(overlay);
			col.appendChild(figure);
			frag.appendChild(col);
		}
	}

	gallery.appendChild(frag);

	// If we got fewer than requested or we didn't add any new ones, maybe we are at the end
	if (loadMoreContainer) {
		if (hasMore && photos.length > 0) {
			loadMoreContainer.classList.remove('d-none');
		} else {
			loadMoreContainer.classList.add('d-none');
		}
	}

	if (newPhotosCount === 0 && append && photos.length > 0 && hasMore) {
		// All photos fetched in this batch were duplicates, try fetching more
		// Note: This is a simplistic approach to handle the fact that search API might return dupes
		void loadPhotos(currentTag!, true);
	}
}

async function loadPhotos(tag: string, append: boolean = false) {
	if (isLoading) return;

	const status = document.getElementById('filmGalleryStatus');
	const loadMoreBtn = document.getElementById(
		'filmLoadMoreBtn'
	) as HTMLButtonElement;

	isLoading = true;
	if (loadMoreBtn && append) {
		loadMoreBtn.disabled = true;
		loadMoreBtn.textContent = 'Loading...';
	} else if (status) {
		status.classList.remove('d-none');
		status.innerHTML = `
			<div class="col-12 text-center">
				<p class="mb-2">Searching BlueSky for ${tag}...</p>
				<div class="spinner-grow text-primary" role="status" aria-label="Loading">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		`;
		if (!append) {
			const gallery = document.getElementById('filmGallery');
			if (gallery) gallery.innerHTML = '';
			const loadMoreContainer = document.getElementById(
				'filmLoadMoreContainer'
			);
			if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
		}
	}

	try {
		const result = await fetchFilmPosts(
			tag,
			append ? currentCursor : undefined
		);
		currentCursor = result.cursor;
		hasMore = !!currentCursor;
		renderGallery(result.photoPosts, append);
	} catch (err) {
		if (status && !append) {
			status.classList.remove('d-none');
			status.innerHTML = `<div class="col-12 text-danger text-center"><p>Failed to load photos.</p></div>`;
		}
		console.error(err);
	} finally {
		isLoading = false;
		if (loadMoreBtn) {
			loadMoreBtn.disabled = false;
			loadMoreBtn.textContent = 'Load More';
		}
	}
}

function handleTabClick(event: Event) {
	event.preventDefault();
	const target = event.target as HTMLElement;
	const tag = target.getAttribute('data-tag');
	if (!tag || tag === currentTag) return;

	// Update active state
	const tabs = document.querySelectorAll('#filmStockTabs .nav-link');
	tabs.forEach((tab) => tab.classList.remove('active'));
	target.classList.add('active');

	currentTag = tag;
	currentCursor = undefined;
	hasMore = true;
	void loadPhotos(tag, false);
}

function initUI() {
	if (uiInitialized) return;

	const tabsContainer = document.getElementById('filmStockTabs');
	if (tabsContainer) {
		FILM_STOCKS.forEach((stock, index) => {
			const li = document.createElement('li');
			li.className = 'nav-item';

			const a = document.createElement('a');
			a.className = `nav-link ${index === 0 ? 'active' : ''}`;
			a.href = '#';
			a.textContent = stock.name;
			a.setAttribute('data-tag', stock.tag);

			// We can use aria-controls if we had tab panes, but we are replacing content in a single container
			a.setAttribute('role', 'tab');
			a.setAttribute('aria-selected', index === 0 ? 'true' : 'false');

			a.addEventListener('click', handleTabClick);
			li.appendChild(a);
			tabsContainer.appendChild(li);
		});
	}

	const loadMoreBtn = document.getElementById('filmLoadMoreBtn');
	if (loadMoreBtn) {
		loadMoreBtn.addEventListener('click', () => {
			if (currentTag && hasMore && !isLoading) {
				void loadPhotos(currentTag, true);
			}
		});
	}

	const galleryContainer = document.getElementById('filmGallery');
	if (galleryContainer) {
		galleryContainer.addEventListener('click', (event) => {
			const target = event.target as HTMLElement;
			const overlay = target.closest('.overlay');
			if (!overlay || !(overlay instanceof HTMLElement)) return;

			const url = overlay.dataset.bskyUrl;
			if (url) {
				window.open(url, '_blank', 'noopener');
			}
		});
	}

	uiInitialized = true;
}

export function initFilmComparison() {
	initUI();

	const checkAndLoad = () => {
		const modal = document.getElementById(modalId);
		if (
			modal &&
			(modal.classList.contains('show') ||
				modal.style.display === 'block' ||
				document.body.classList.contains('modal-open'))
		) {
			if (!currentTag) {
				// Initialize with the first stock
				const firstTab = document.querySelector(
					'#filmStockTabs .nav-link'
				) as HTMLElement;
				if (firstTab) {
					firstTab.click();
				} else if (FILM_STOCKS.length > 0) {
					currentTag = FILM_STOCKS[0].tag;
					void loadPhotos(currentTag, false);
				}
			}
		}
	};

	document.addEventListener('show.bs.modal', (e) => {
		const target = e.target as HTMLElement | null;
		if (target && target.id === modalId) {
			checkAndLoad();
		}
	});

	checkAndLoad();
	setTimeout(checkAndLoad, 100);
}
