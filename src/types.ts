export type FeedConfig = {
  source: string;
  url: string;
};

export type Article = {
  title: string;
  link: string;
  publishedAt: Date;
  source: string;
  description: string;
  summary: string;
};

export type FeedResult = {
  source: string;
  articles: Article[];
};

export type FeedFailure = {
  source: string;
  error: Error;
};
