import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIST_DIR = resolve(__dirname, '../../dist');
const distExists = existsSync(DIST_DIR);

// Build-output checks. Service worker, workbox and version-mismatch files are
// not required: the UI does not register a worker or verify a PWA update.
describe('UI build output', () => {
	if (!distExists) {
		console.warn(`⚠ Skipping UI build output tests - dist/ not found (run 'npm run build' first)`);
		it('skipped - dist/ not found', () => {});

		return;
	}

	const indexContent = readFileSync(resolve(DIST_DIR, 'index.html'), 'utf-8');

	describe('Core files exist', () => {
		it('index.html exists', () => {
			expect(existsSync(resolve(DIST_DIR, 'index.html'))).toBeTruthy();
		});

		it('SvelteKit bundle.js exists in _app/immutable/', () => {
			const appDir = resolve(DIST_DIR, '_app', 'immutable');

			expect(existsSync(appDir), '_app/immutable/ not found').toBeTruthy();
			const files = readdirSync(appDir).filter((f) => f.startsWith('bundle.') && f.endsWith('.js'));

			expect(files.length).toBeGreaterThan(0);
		});

		it('SvelteKit bundle.css exists in _app/immutable/assets/', () => {
			const cssDir = resolve(DIST_DIR, '_app', 'immutable', 'assets');

			expect(existsSync(cssDir), '_app/immutable/assets/ not found').toBeTruthy();
			const files = readdirSync(cssDir).filter(
				(f) => f.startsWith('bundle.') && f.endsWith('.css')
			);

			expect(files.length).toBeGreaterThan(0);
		});
	});

	describe('index.html content', () => {
		it('has modulepreload link for SvelteKit bundle with content hash', () => {
			expect(indexContent).toBeTruthy();
			expect(indexContent).toMatch(/href="(\.\/|\/)_app\/immutable\/bundle\.[a-zA-Z0-9_-]+\.js"/);
		});

		it('has stylesheet link for SvelteKit bundle.css with content hash', () => {
			expect(indexContent).toBeTruthy();
			expect(indexContent).toMatch(
				/href="(\.\/|\/)_app\/immutable\/assets\/bundle\.[a-zA-Z0-9_-]+\.css"/
			);
		});

		it('has dynamic import for SvelteKit bundle with content hash', () => {
			expect(indexContent).toBeTruthy();
			expect(indexContent).toMatch(
				/import\("(\.\/|\/)_app\/immutable\/bundle\.[a-zA-Z0-9_-]+\.js"\)/
			);
		});

		it('has __sveltekit__ variable (SvelteKit adds hash suffix)', () => {
			expect(indexContent).toBeTruthy();
			expect(indexContent).toMatch(/__sveltekit_[a-zA-Z0-9-]+/);
		});

		it('does not register a service worker', () => {
			expect(indexContent).not.toMatch(/navigator\.serviceWorker\.register/);
		});

		it('has _app paths for SvelteKit bundles', () => {
			expect(indexContent).toBeTruthy();
			expect(indexContent).toMatch(/_app\//);
		});
	});

	describe('SvelteKit _app directory', () => {
		it('_app directory exists (SvelteKit uses it for hashed assets)', () => {
			expect(existsSync(resolve(DIST_DIR, '_app'))).toBeTruthy();
		});
	});

});
