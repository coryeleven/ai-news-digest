import Parser from "rss-parser";
import { isWithinLast24Hours, toArticle } from "./article.js";
import type { FeedConfig, FeedFailure, FeedResult } from "./types.js";

const parser = new Parser();

export async function fetchFeeds(feeds: FeedConfig[]): Promise<{
  results: FeedResult[];
  failures: FeedFailure[];
}> {
  const settled = await Promise.allSettled(feeds.map(fetchFeed));
  const results: FeedResult[] = [];
  const failures: FeedFailure[] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      results.push(result.value);
      return;
    }

    failures.push({
      source: feeds[index].source,
      error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
    });
  });

  return { results, failures };
}

async function fetchFeed(feed: FeedConfig): Promise<FeedResult> {
  const parsed = await parser.parseURL(feed.url);
  const articles = parsed.items
    .map((item) => toArticle(item, feed))
    .filter((article) => article !== null)
    .filter((article) => isWithinLast24Hours(article));

  return {
    source: feed.source,
    articles,
  };
}
