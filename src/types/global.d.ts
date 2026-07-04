declare module '*.scss' {
	const content: string;
	export default content;
}

declare module '*.css' {
	const content: string;
	export default content;
}

// Bootstrap does not ship type definitions for its individual ESM entry
// points (e.g. 'bootstrap/js/dist/tooltip'). Model the small surface we use:
// a constructor plus the static `getInstance` helper and the instance methods
// invoked in main.ts.
declare module 'bootstrap/js/dist/*' {
	interface BootstrapComponentInstance {
		show(): void;
		hide(): void;
		toggle(): void;
		dispose(): void;
	}
	interface BootstrapComponentConstructor {
		new (
			element: Element | string,
			config?: unknown
		): BootstrapComponentInstance;
		getInstance(
			element: Element | string
		): BootstrapComponentInstance | null;
		getOrCreateInstance(
			element: Element | string,
			config?: unknown
		): BootstrapComponentInstance;
	}
	const Component: BootstrapComponentConstructor;
	export default Component;
}
