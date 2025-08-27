import {
	AtpAgent,
	AppBskyFeedDefs,
	AppBskyEmbedImages,
	AppBskyEmbedRecordWithMedia,
} from '@atproto/api';

const agent = new AtpAgent({ service: 'https://api.bsky.app' });
const username = 'gwood.dev';

type PhotoImage = {
	fullsize: string;
	thumb?: string;
	alt?: string;
};

type PhotoPost = {
	postUri: string;
	authorHandle: string;
	text: string;
	createdAt?: string;
	images: PhotoImage[];
};

function extractImagesFromPost(post: AppBskyFeedDefs.PostView): PhotoImage[] {
	const out: PhotoImage[] = [];
	const embed = post.embed as
		| AppBskyEmbedImages.View
		| AppBskyEmbedRecordWithMedia.View
		| undefined;

	if (!embed) return out;

	// Direct images
	if ((embed as any)?.$type === 'app.bsky.embed.images#view') {
		for (const img of (embed as AppBskyEmbedImages.View).images ?? []) {
			out.push({
				fullsize: img.fullsize,
				thumb: img.thumb,
				alt: img.alt,
			});
		}
	}

	// Record with media (may contain images)
	if ((embed as any)?.$type === 'app.bsky.embed.recordWithMedia#view') {
		const media = (embed as AppBskyEmbedRecordWithMedia.View).media;
		if ((media as any)?.$type === 'app.bsky.embed.images#view') {
			for (const img of (media as AppBskyEmbedImages.View).images ?? []) {
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

function toPhotoPost(post: AppBskyFeedDefs.PostView): PhotoPost {
	const record = post.record as
		| { text?: string; createdAt?: string }
		| undefined;
	return {
		postUri: post.uri,
		authorHandle: post.author.handle,
		text: record?.text ?? '',
		createdAt: record?.createdAt,
		images: extractImagesFromPost(post),
	};
}

// Fetch a single page
export async function fetchPhotoPostsPage(params?: {
	cursor?: string;
	pageSize?: number;
}) {
	const limit = Math.min(Math.max(params?.pageSize ?? 60, 1), 60); // API cap: 100
	const res = await agent.api.app.bsky.feed.searchPosts({
		q: '\u{1F39E} | \u{1F4F7}',
		author: username,
		limit,
		sort: 'top',
		cursor: params?.cursor,
	});

	if (!res.success) throw new Error('Error fetching Bluesky posts.');
	const posts = res.data.posts as AppBskyFeedDefs.PostView[];

	const photoPosts = posts
		.map(toPhotoPost)
		.filter((p) => p.images.length > 0);

	return {
		cursor: res.data.cursor,
		photoPosts,
		raw: res.data, // keep if you need anything else
	};
}

// Fetch multiple pages until you have N photo posts or run out
export async function fetchPhotos(maxPhotos = 50) {
	const all: PhotoPost[] = [];
	let cursor: string | undefined = undefined;

	while (all.length < maxPhotos) {
		const { photoPosts, cursor: next } = await fetchPhotoPostsPage({
			cursor,
			pageSize: 60,
		});

		all.push(...photoPosts);

		if (!next || photoPosts.length === 0) break;
		cursor = next;
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
	for (const post of photos) {
		for (const img of post.images) {
			const col = document.createElement('div');
			col.className = 'col';

			const figure = document.createElement('figure');
			figure.className = 'figure m-0 position-relative pp-tile';

			const image = document.createElement('img');
			image.className = 'figure-img img-fluid rounded shadow-sm pp-img';
			image.loading = 'lazy';
			image.alt = img.alt || post.text || 'Photo';
			image.src = img.thumb || img.fullsize;

			figure.appendChild(image);

			const overlay = document.createElement('div');
			overlay.className = 'overlay rounded';

			// Open the original post on BlueSky when clicked
			overlay.addEventListener('click', () => {
				const postId = post.postUri.split('/').pop();
				window.open(
					`https://bsky.app/profile/${post.authorHandle}/post/${postId}`,
					'_blank',
					'noopener'
				);
			});

			figure.appendChild(overlay);
			col.appendChild(figure);
			frag.appendChild(col);
		}
	}
	gallery.appendChild(frag);
}

// Defer fetching until the modal is shown the first time
let photosLoaded = false;
async function ensurePhotosLoaded() {
	if (photosLoaded) return;
	try {
		const status = document.getElementById('ppGalleryStatus');
		if (status) status.classList.remove('visually-hidden');
		const photos = await fetchPhotos(60);
		renderGallery(photos);
	} catch (err) {
		const status = document.getElementById('ppGalleryStatus');
		if (status) {
			status.className = 'col text-danger text-center';
			status.textContent = 'Failed to load photos.';
		}
		// eslint-disable-next-line no-console
		console.error(err);
	} finally {
		photosLoaded = true;
	}
}

// Listen for Bootstrap modal show event
document.addEventListener('shown.bs.modal', (e) => {
	const target = e.target as HTMLElement | null;
	if (target && target.id === 'ppModal') {
		void ensurePhotosLoaded();
	}
});
