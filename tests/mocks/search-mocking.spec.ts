import { expect, Route, test } from '@playwright/test';
import { searchErrorHtml, searchResultsHtml } from './search-fixtures';

const searchDocumentUrl = /^https:\/\/openlibrary\.org\/search\?q=/;

test('mocked server-rendered search shows books with optional authors', async ({ page }) => {
  const interceptedRequests: { method: string; pathname: string; query: string | null }[] = [];
  const handler = async (route: Route): Promise<void> => {
    const request = route.request();
    if (!request.isNavigationRequest() || request.method() !== 'GET') {
      await route.continue();
      return;
    }

    const url = new URL(request.url());
    interceptedRequests.push({
      method: request.method(),
      pathname: url.pathname,
      query: url.searchParams.get('q'),
    });
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: searchResultsHtml('mock-success', [
        { title: 'Mocked Book with Author', workKey: '/works/OL900001W', author: 'Ada Author' },
        { title: 'Mocked Book without Author', workKey: '/works/OL900002W' },
      ]),
    });
  };

  await page.route(searchDocumentUrl, handler);
  try {
    await test.step('Intercept the search document and assert rendered mock cards', async () => {
      await page.goto('/search?q=mock-success');
      expect(interceptedRequests).toEqual([
        { method: 'GET', pathname: '/search', query: 'mock-success' },
      ]);

      const cards = page.locator('.searchResultItem');
      await expect(cards).toHaveCount(2);
      await expect(cards.nth(0).locator('.booktitle a')).toHaveText('Mocked Book with Author');
      await expect(cards.nth(0).locator('.bookauthor')).toContainText('Ada Author');
      await expect(cards.nth(1).locator('.booktitle a')).toHaveText('Mocked Book without Author');
      await expect(cards.nth(1).locator('.bookauthor')).toHaveCount(0);
    });
  } finally {
    await page.unroute(searchDocumentUrl, handler);
  }
});

test('mocked zero-results document shows the observed empty state', async ({ page }) => {
  const interceptedRequests: { method: string; pathname: string; query: string | null }[] = [];
  const handler = async (route: Route): Promise<void> => {
    if (!route.request().isNavigationRequest() || route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    interceptedRequests.push({
      method: route.request().method(),
      pathname: url.pathname,
      query: url.searchParams.get('q'),
    });
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: searchResultsHtml('mock-empty', []),
    });
  };

  await page.route(searchDocumentUrl, handler);
  try {
    await test.step('Verify a successful zero-results search is visible', async () => {
      await page.goto('/search?q=mock-empty');
      expect(interceptedRequests).toEqual([
        { method: 'GET', pathname: '/search', query: 'mock-empty' },
      ]);
      await expect(page.locator('.searchResultItem')).toHaveCount(0);
      await expect(page.getByText('No matching books or authors')).toBeVisible();
    });
  } finally {
    await page.unroute(searchDocumentUrl, handler);
  }
});

test('mocked HTTP 500 response displays the returned error document', async ({ page }) => {
  const interceptedRequests: { method: string; pathname: string; query: string | null }[] = [];
  const handler = async (route: Route): Promise<void> => {
    if (!route.request().isNavigationRequest() || route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    interceptedRequests.push({
      method: route.request().method(),
      pathname: url.pathname,
      query: url.searchParams.get('q'),
    });
    await route.fulfill({
      status: 500,
      contentType: 'text/html; charset=utf-8',
      body: searchErrorHtml(),
    });
  };

  await page.route(searchDocumentUrl, handler);
  try {
    await test.step('Assert the request failure status and visible error response', async () => {
      const response = await page.goto('/search?q=mock-error');
      expect(interceptedRequests).toEqual([
        { method: 'GET', pathname: '/search', query: 'mock-error' },
      ]);
      expect(response?.status()).toBe(500);
      await expect(page.getByRole('alert')).toContainText('Service temporarily unavailable');
      await expect(page.getByText('Please try again later.')).toBeVisible();
    });
  } finally {
    await page.unroute(searchDocumentUrl, handler);
  }
});