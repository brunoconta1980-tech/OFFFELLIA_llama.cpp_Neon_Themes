import { readable } from 'svelte/store';

/**
 * PWA update checks are disabled.
 *
 * The hook remains so the layout can keep a stable call site. It does not
 * register a service worker, poll for a new build, or compare versions.
 */
export function usePwa() {
	const needRefresh = readable(false);

	return {
		needRefresh,
		get needRefreshByStorage() {
			return false;
		},
		updateServiceWorker: (_reloadPage?: boolean) => {}
	};
}
