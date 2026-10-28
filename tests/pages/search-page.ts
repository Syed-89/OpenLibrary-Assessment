import { Locator, Page } from '@playwright/test';

export class SearchPage {
  readonly results: Locator;

  constructor(private readonly page: Page) {
    this.results = page.locator('.searchResultItem');
  }

  async open(query: string): Promise<void> {
    const search = new URLSearchParams({ q: query });
    await this.page.goto(`/search?${search.toString()}`, { waitUntil: 'domcontentloaded' });
  }

  resultTitle(index: number): Locator {
    return this.results.nth(index).locator('.booktitle a');
  }

  resultAuthor(index: number): Locator {
    return this.results.nth(index).locator('.bookauthor');
  }
}
