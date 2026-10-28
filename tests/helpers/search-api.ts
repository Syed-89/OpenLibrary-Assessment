import { APIRequestContext, APIResponse } from '@playwright/test';

export interface SearchDoc {
  title?: string;
  author_name?: string[];
  key?: string;
}

export interface SearchResponse {
  numFound: number;
  docs: SearchDoc[];
}

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
}

const MIN_API_REQUEST_INTERVAL_MS = 1_000;

let apiRequestQueue: Promise<void> = Promise.resolve();
let lastApiRequestStartedAt: number | undefined;

function withApiRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  const result = apiRequestQueue.then(async () => {
    if (lastApiRequestStartedAt !== undefined) {
      const elapsed = performance.now() - lastApiRequestStartedAt;
      const remaining = MIN_API_REQUEST_INTERVAL_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining));
      }
    }

    lastApiRequestStartedAt = performance.now();
    return operation();
  });

  apiRequestQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

export function searchLibrary(
  request: APIRequestContext,
  params: SearchParams,
): Promise<APIResponse> {
  const queryParams: Record<string, string | number | boolean> = { q: params.q };
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.offset !== undefined) queryParams.offset = params.offset;

  return withApiRateLimit(() => request.get('/search.json', { params: queryParams }));
}

export function normalizeTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
