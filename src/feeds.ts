import type { FeedConfig } from "./types.js";

export const feeds: FeedConfig[] = [
  {
    source: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    source: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
  {
    source: "Hacker News",
    url: "https://hnrss.org/newest?q=AI&count=30",
  },
];
