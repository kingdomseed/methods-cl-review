import { test, expect } from '@playwright/test';

// Each test in this file proves a semantic HTML issue from the code review.
// All tests should FAIL against the current index.html, proving the bug exists.
// After fixes, they should PASS.

test.describe('Semantic HTML structure', () => {

  test.beforeEach(async ({ page }) => {
    const path = require('path');
    await page.goto(`file://${path.resolve(__dirname, '..', 'index.html')}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#frontBody');
  });

  // Review issue #2: No <main> landmark wrapping the app content
  test('page has a <main> landmark element', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toHaveCount(1);
    // The main element should contain the flashcard app
    await expect(main.locator('h1')).toBeVisible();
  });

  // Review issue #2: Header section should use semantic <header> element
  test('page header uses <header> element', async ({ page }) => {
    const header = page.locator('main header, body > header');
    await expect(header).toHaveCount(1);
    await expect(header.locator('h1')).toBeVisible();
  });

  // Review issue #19: Keyboard key labels should use <kbd> not <span>
  test('keyboard key labels use <kbd> elements', async ({ page }) => {
    // Action buttons have key hints (e.g., "1" for Missed, "2" for Know it)
    const actionKeys = page.locator('.actions .key');
    const count = await actionKeys.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const tagName = await actionKeys.nth(i).evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('kbd');
    }
  });

  // Review issue #19: Shortcut overlay keys should also use <kbd>
  test('shortcut overlay key labels use <kbd> elements', async ({ page }) => {
    const shortcutKeys = page.locator('.shortcut-key');
    const count = await shortcutKeys.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const tagName = await shortcutKeys.nth(i).evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('kbd');
    }
  });

  // Review issue: Subtitle should be a <p>, not a <div>
  test('subtitle uses a <p> element', async ({ page }) => {
    const subtitle = page.locator('.subtitle');
    const tagName = await subtitle.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('p');
  });

  // Review issue: Stats row items should use a list
  test('stats row uses a list element', async ({ page }) => {
    const statsRow = page.locator('.stats-row');
    const tagName = await statsRow.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('ul');

    const items = statsRow.locator('.stat-item');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const itemTag = await items.nth(i).evaluate(el => el.tagName.toLowerCase());
      expect(itemTag).toBe('li');
    }
  });

  // Review issue: Shortcut overlay key/action pairs should use <dl>/<dt>/<dd>
  test('shortcut overlay uses definition list for key mappings', async ({ page }) => {
    const panel = page.locator('.shortcut-panel');
    const dl = panel.locator('dl');
    await expect(dl).toHaveCount(1);
  });
});
