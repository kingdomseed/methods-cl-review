import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TARGET = 'https://methods-cl-study-guide.vercel.app/flashcards';
const root = path.resolve(__dirname, '..');

for (const file of ['index.html', 'methods-flashcards.html']) {
  test(`${file} redirects to the study guide flashcards`, async ({ page }) => {
    await page.route('https://methods-cl-study-guide.vercel.app/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<p>study guide</p>' }),
    );
    await page.goto(`file://${path.join(root, file)}`);
    await expect(page).toHaveURL(TARGET);
  });

  test(`${file} also redirects without JavaScript and shows a manual link`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${TARGET}">`);
    expect(html).toMatch(new RegExp(`<main>[\\s\\S]*<a href="${TARGET}">[\\s\\S]*</main>`));
  });
}

test('_redirects sends every legacy path to the study guide with a 301', () => {
  const rules = fs
    .readFileSync(path.join(root, '_redirects'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.split(/\s+/));
  expect(rules.map(([from]) => from)).toEqual(['/', '/index.html', '/methods-flashcards', '/methods-flashcards.html']);
  for (const [, to, status] of rules) {
    expect(to).toBe(TARGET);
    expect(status).toBe('301');
  }
});
