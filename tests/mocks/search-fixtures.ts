interface MockBook {
  title: string;
  workKey: string;
  author?: string;
}

export function searchResultsHtml(query: string, books: MockBook[]): string {
  const cards = books
    .map(
      ({ title, workKey, author }) => `
        <li class="searchResultItem sri--w-main" itemscope itemtype="https://schema.org/Book">
          <div class="sri__main">
            <div class="details">
              <div class="resultTitle">
                <h3 class="booktitle"><a class="results" href="${workKey}">${title}</a></h3>
                ${author ? `<span class="bookauthor">by <a href="/authors/OL1A">${author}</a></span>` : ''}
              </div>
            </div>
          </div>
        </li>`,
    )
    .join('');

  return `<!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><title>search | Open Library</title></head>
      <body>
        <form action="/search" method="get">
          <label for="search">Search</label>
          <input id="search" name="q" type="search" value="${query}">
          <button type="submit">Search</button>
        </form>
        <main id="test-body-mobile">
          <h1>Search Books</h1>
          ${books.length
            ? `<ul class="searchResults">${cards}</ul>`
            : '<p>No matching books or authors</p>'}
        </main>
      </body>
    </html>`;
}

export function searchErrorHtml(): string {
  return `<!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><title>Open Library error</title></head>
      <body>
        <main id="test-body-mobile">
          <div role="alert">
            <h1>Service temporarily unavailable</h1>
            <p>Please try again later.</p>
          </div>
        </main>
      </body>
    </html>`;
}
