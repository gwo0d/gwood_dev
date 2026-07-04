export const BSKY_API = 'https://api.bsky.app';
export const BSKY_USERNAME = 'gwood.dev';
export const PHOTO_QUERY = '\u{1F39E} | \u{1F4F7}';

// Minimal shapes for the subset of the Bluesky app view API we consume.
// We only read a handful of fields, so we avoid pulling in the full SDK.
interface BskyImageView {
	fullsize: string;
	thumb?: string;
	alt?: string;
}

interface BskyImagesEmbedView {
	$type: 'app.bsky.embed.images#view';
	images?: BskyImageView[];
}

interface BskyRecordWithMediaView {
	$type: 'app.bsky.embed.recordWithMedia#view';
	media?: unknown;
}

interface BskyPostRecord {
	$type: 'app.bsky.feed.post';
	text?: string;
	createdAt?: string;
}

interface BskyPostView {
	uri: string;
	author: { handle: string };
	record?: unknown;
	embed?: unknown;
}

interface SearchPostsResponse {
	cursor?: string;
	posts?: BskyPostView[];
}

interface PhotoImage {
	fullsize: string;
	thumb?: string;
	alt?: string;
}

interface PhotoPost {
	postUri: string;
	authorHandle: string;
	text: string;
	createdAt?: string;
	images: PhotoImage[];
}

// Call the public, unauthenticated searchPosts endpoint directly.
async function searchPosts(params: {
	q: string;
	author: string;
	limit: number;
	sort: string;
	cursor?: string;
}): Promise<SearchPostsResponse> {
	const url = new URL('/xrpc/app.bsky.feed.searchPosts', BSKY_API);
	url.searchParams.set('q', params.q);
	url.searchParams.set('author', params.author);
	url.searchParams.set('limit', String(params.limit));
	url.searchParams.set('sort', params.sort);
	if (params.cursor) url.searchParams.set('cursor', params.cursor);

	const res = await fetch(url, {
		headers: { Accept: 'application/json' },
	});

	if (!res.ok) {
		throw new Error(`Bluesky search failed with status ${res.status}`);
	}

	return (await res.json()) as SearchPostsResponse;
}

function isPostRecord(value: unknown): value is BskyPostRecord {
	return (
		typeof value === 'object' &&
		value !== null &&
		'$type' in value &&
		(value as { $type: string }).$type === 'app.bsky.feed.post'
	);
}

const isImagesEmbed = (value: unknown): value is BskyImagesEmbedView =>
	(value as BskyImagesEmbedView)?.$type === 'app.bsky.embed.images#view';

const isRecordWithMedia = (value: unknown): value is BskyRecordWithMediaView =>
	(value as BskyRecordWithMediaView)?.$type ===
	'app.bsky.embed.recordWithMedia#view';

function extractImagesFromPost(post: BskyPostView): PhotoImage[] {
	const out: PhotoImage[] = [];
	const embed = post.embed;

	if (!embed) return out;

	// Direct images
	if (isImagesEmbed(embed)) {
		for (const img of embed.images ?? []) {
			out.push({
				fullsize: img.fullsize,
				thumb: img.thumb,
				alt: img.alt,
			});
		}
	}

	// Record with media (may contain images)
	if (isRecordWithMedia(embed)) {
		const media = embed.media;
		if (isImagesEmbed(media)) {
			for (const img of media.images ?? []) {
				out.push({
					fullsize: img.fullsize,
					thumb: img.thumb,
					alt: img.alt,
				});
			}
		}
	}

	return out;
}

function toPhotoPost(post: BskyPostView): PhotoPost {
	let text = '';
	let createdAt: string | undefined;

	if (isPostRecord(post.record)) {
		text = post.record.text ?? '';
		createdAt = post.record.createdAt;
	} else {
		// Loose fallback for records that omit an explicit $type.
		const record = post.record as
			| { text?: string; createdAt?: string }
			| undefined;
		if (record) {
			text = record.text ?? '';
			createdAt = record.createdAt;
		}
	}

	return {
		postUri: post.uri,
		authorHandle: post.author.handle,
		text,
		createdAt,
		images: extractImagesFromPost(post),
	};
}

// Fetch a single page
export async function fetchPhotoPostsPage(params?: {
	cursor?: string;
	pageSize?: number;
}) {
	const limit = Math.min(Math.max(params?.pageSize ?? 60, 1), 100); // API cap: 100
	try {
		const data = await searchPosts({
			q: PHOTO_QUERY,
			author: BSKY_USERNAME,
			limit,
			sort: 'top',
			cursor: params?.cursor,
		});

		const posts = data.posts ?? [];

		const photoPosts: PhotoPost[] = [];
		for (const post of posts) {
			const photoPost = toPhotoPost(post);
			if (photoPost.images.length > 0) {
				photoPosts.push(photoPost);
			}
		}

		return {
			cursor: data.cursor,
			photoPosts,
			rawCount: posts.length,
		};
	} catch (error) {
		console.error('Failed to fetch posts page:', error);
		throw error; // Re-throw to be handled by caller
	}
}

// Fetch multiple pages until you have N photo posts or run out
export async function fetchPhotos(maxPhotos = 50) {
	const all: PhotoPost[] = [];
	let cursor: string | undefined = undefined;

	while (all.length < maxPhotos) {
		try {
			const {
				photoPosts,
				cursor: next,
				rawCount,
			} = await fetchPhotoPostsPage({
				cursor,
				// Optimization: Request max batch size (100) to reduce round-trips
				pageSize: 100,
			});

			all.push(...photoPosts);

			// Stop only when the API runs out of results (no cursor) or the
			// page returned no posts at all. A page that contains posts but no
			// images must NOT end the loop, or we would stop prematurely.
			if (!next || rawCount === 0) break;
			cursor = next;
		} catch (error) {
			console.error('Error in fetchPhotos loop:', error);
			break; // Stop fetching on error
		}
	}

	return all.slice(0, maxPhotos);
}

// --- Rendering into Bootstrap gallery in the modal ---
function renderGallery(photos: PhotoPost[]) {
	const gallery = document.getElementById('ppGallery');
	const status = document.getElementById('ppGalleryStatus');
	if (!gallery) return;

	// Clear status if present
	if (status) status.classList.add('visually-hidden');

	if (photos.length === 0) {
		const empty = document.createElement('div');
		empty.className = 'col text-center text-body-secondary';
		empty.textContent = 'No photos found.';
		gallery.appendChild(empty);
		return;
	}

	const frag = document.createDocumentFragment();

	// Optimization: Extract existing post URIs into a Set for faster lookup
	const renderedUris = new Set(
		Array.from(gallery.querySelectorAll('.pp-tile')).map((el) =>
			el.getAttribute('data-post-uri')
		)
	);

	for (const post of photos) {
		// Dedup: Check if post is already rendered
		if (renderedUris.has(post.postUri)) continue;

		// Open the original post on BlueSky when activated
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
			image.alt = img.alt || post.text || 'Photo';
			image.src = img.thumb || img.fullsize;

			figure.appendChild(image);

			const overlay = document.createElement('button');
			overlay.type = 'button';
			overlay.className = 'overlay rounded';
			const ariaLabel =
				img.alt?.trim() || post.text?.trim() || 'Open post on BlueSky';
			overlay.setAttribute('aria-label', ariaLabel);

			overlay.setAttribute('data-bsky-url', bskyUrl);

			figure.appendChild(overlay);
			col.appendChild(figure);
			frag.appendChild(col);
		}
	}
	gallery.appendChild(frag);
}

// Defer fetching until the modal is shown the first time
let photosLoaded = false;
let isLoading = false;
async function ensurePhotosLoaded() {
	if (photosLoaded || isLoading) return;
	isLoading = true;

	const status = document.getElementById('ppGalleryStatus');
	if (status) status.classList.remove('visually-hidden');
	try {
		const photos = await fetchPhotos(60);
		renderGallery(photos);
		photosLoaded = true;
	} catch (err) {
		if (status) {
			status.className = 'col text-danger text-center';
			status.textContent = 'Failed to load photos.';
		}
		console.error(err);
	} finally {
		isLoading = false;
	}
}

// Init function to be called from main.ts
export function initPhotography() {
	const modalId = 'ppModal';
	// Listen for Bootstrap modal show event
	document.addEventListener('show.bs.modal', (e) => {
		const target = e.target as HTMLElement | null;
		if (target && target.id === modalId) {
			void ensurePhotosLoaded();
		}
	});

	// If the modal is already open or opening (e.g. strict lazy loading), fetch immediately
	// We also use a short timeout to catch race conditions where the modal is transitioning
	// but the 'show' class or display style hasn't been applied yet.
	const checkAndLoad = () => {
		const modal = document.getElementById(modalId);
		if (
			modal &&
			(modal.classList.contains('show') ||
				modal.style.display === 'block' ||
				document.body.classList.contains('modal-open'))
		) {
			void ensurePhotosLoaded();
		}
	};

	checkAndLoad();
	setTimeout(checkAndLoad, 100);

	// Event Delegation for Gallery Items
	const galleryContainer = document.getElementById('ppGallery');
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
}
