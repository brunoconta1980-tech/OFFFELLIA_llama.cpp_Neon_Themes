import { expect, test } from '@playwright/test';

test.describe('UI without PWA verification', () => {
	test('does not register a service worker', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const scriptURL = await page.evaluate(async () => {
			const registration = await navigator.serviceWorker.getRegistration();

			return registration?.active?.scriptURL ?? null;
		});

		expect(scriptURL).toBeNull();
	});

	test('index.html contains content-hashed bundle references', async ({ page }) => {
		const response = await page.request.get('/');

		expect(response.ok()).toBeTruthy();

		const html = await response.text();

		expect(html).toMatch(/href="(\.\/|\/)_app\/immutable\/bundle\.[a-zA-Z0-9_-]+\.js"/);
		expect(html).toMatch(/href="(\.\/|\/)_app\/immutable\/assets\/bundle\.[a-zA-Z0-9_-]+\.css"/);
		expect(html).toMatch(/import\("(\.\/|\/)_app\/immutable\/bundle\.[a-zA-Z0-9_-]+\.js"\)/);
		expect(html).not.toMatch(/navigator\.serviceWorker\.register/);
	});
});
