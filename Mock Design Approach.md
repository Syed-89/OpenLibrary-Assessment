Testing Approach
The tests are divided into two types: live tests and mocked tests.

Live Tests: These tests send real requests to Open Library. The UI tests use the /search page to check search results, while the API tests use /search.json to verify the API responses.

Mocked Tests: These tests do not rely on live responses. Instead, they intercept requests to /search?q=... and return sample HTML pages that follow the structure of the actual search results. They cover different scenarios, including books with and without authors, searches that return no results, and server errors.

Test Isolation: After each mocked test, the route is removed to ensure it does not interfere with the live tests.

