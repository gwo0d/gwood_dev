declare module '*.scss' {
	const content: string;
	export default content;
}

declare module 'bootstrap/js/dist/*' {
	const Component: new (...args: unknown[]) => unknown;
	export default Component;
}
