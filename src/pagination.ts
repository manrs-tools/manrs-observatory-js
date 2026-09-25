export interface Page<T> {
  items: T[];
  nextPageToken?: string;
}

export type PageFetcher<T> = (pageToken: string | undefined) => Promise<Page<T>>;

/**
 * Lazily fetches pages of results as they're consumed. Supports both
 * `for await (const item of iterator)` and manual `.next()` calls.
 */
export class PageIterator<T> implements AsyncIterable<T> {
  private readonly fetchPage: PageFetcher<T>;
  private page: T[] = [];
  private index = 0;
  private nextToken: string | undefined;
  private started = false;
  private finished = false;

  constructor(fetchPage: PageFetcher<T>) {
    this.fetchPage = fetchPage;
  }

  async next(): Promise<IteratorResult<T>> {
    while (this.index >= this.page.length) {
      if (this.finished) {
        return { done: true, value: undefined };
      }
      if (this.started && !this.nextToken) {
        this.finished = true;
        return { done: true, value: undefined };
      }

      const { items, nextPageToken } = await this.fetchPage(this.nextToken);
      this.page = items;
      this.index = 0;
      this.nextToken = nextPageToken;
      this.started = true;
    }

    const value = this.page[this.index];
    this.index++;
    return { done: false, value: value as T };
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return { next: () => this.next() };
  }

  /** Collects every remaining item into an array, optionally stopping after `limit` items. */
  async toArray(limit?: number): Promise<T[]> {
    const out: T[] = [];
    for await (const item of this) {
      out.push(item);
      if (limit !== undefined && out.length >= limit) break;
    }
    return out;
  }
}
