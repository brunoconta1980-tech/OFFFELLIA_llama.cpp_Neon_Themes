import { browser } from '$app/environment';
import { ColorMode } from '$lib/enums';
import { setMode } from 'mode-watcher';

const WATCHER_MODES = new Set<string>([ColorMode.LIGHT, ColorMode.DARK, ColorMode.SYSTEM]);

const NEON_THEMES = new Set<string>([
	ColorMode.NEON_BLUE,
	ColorMode.NEON_RED,
	ColorMode.NEON_GREEN,
	ColorMode.NEON_BLACK_GREY,
	ColorMode.NEON_ALUMINUM
]);

/** Apply a saved theme. Neon palettes ride on the dark base and a class on <html>. */
export function applyUiTheme(theme: string) {
	if (!browser) return;

	const root = document.documentElement;

	for (const name of NEON_THEMES) {
		root.classList.remove(name);
	}

	if (NEON_THEMES.has(theme)) {
		root.classList.add(theme);
		setMode('dark');

		return;
	}

	const base = WATCHER_MODES.has(theme) ? theme : ColorMode.SYSTEM;

	setMode(base as 'light' | 'dark' | 'system');
}
