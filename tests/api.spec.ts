import { expect, test } from '@playwright/test';
import { searchLibrary, SearchResponse } from './helpers/search-api';

test('API search returns titled records and handles optional authors', async ({ request }) => {
  await test.step('Search the public catalog with an explicit result limit', async () => {
    const response = await searchLibrary(request, { q: 'The Hobbit', limit: 5 });
    expect(response.status()).toBe(200);

    const result = (await response.json()) as SearchResponse;
    expect(typeof result.numFound).toBe('number');
    expect(result.numFound).toBeGreaterThan(0);
    expect(result.docs.length).toBeGreaterThan(0);
    expect(result.docs.length).toBeLessThanOrEqual(5);

    for (const doc of result.docs.slice(0, 5)) {
      expect(typeof doc.title).toBe('string');
      expect(doc.title?.trim()).not.toBe('');
      if (doc.author_name !== undefined) {
        expect(Array.isArray(doc.author_name)).toBe(true);
        for (const author of doc.author_name) {
          expect(typeof author).toBe('string');
          expect(author.trim()).not.toBe('');
        }
      }
    }
  });
});

test('API search returns an empty result for a nonsense query', async ({ request }) => {
  await test.step('Verify the empty API response shape', async () => {
    const response = await searchLibrary(request, {
      q: 'zzzxxyy-no-book-match-20261024',
    });
    expect(response.status()).toBe(200);

    const result = (await response.json()) as SearchResponse;
    expect(result.numFound).toBe(0);
    expect(result.docs).toEqual([]);
  });
});

test('API pagination respects limits and does not repeat work keys', async ({ request }) => {
  const limit = 10;

  await test.step('Fetch two consecutive pages with an explicit limit', async () => {
    const firstResponse = await searchLibrary(request, { q: 'The Hobbit', limit, offset: 0 });
    const secondResponse = await searchLibrary(request, {
      q: 'The Hobbit',
      limit,
      offset: limit,
    });
    expect(firstResponse.status()).toBe(200);
    expect(secondResponse.status()).toBe(200);

    const firstPage = (await firstResponse.json()) as SearchResponse;
    const secondPage = (await secondResponse.json()) as SearchResponse;

    expect(firstPage.docs.length).toBeLessThanOrEqual(limit);
    expect(secondPage.docs.length).toBeLessThanOrEqual(limit);

    const firstKeys = new Set(
      firstPage.docs.map((doc) => doc.key).filter((key): key is string => Boolean(key)),
    );
    const secondKeys = secondPage.docs
      .map((doc) => doc.key)
      .filter((key): key is string => Boolean(key));
    expect(secondKeys.some((key) => firstKeys.has(key))).toBe(false);
  });
});
