import type Parser from "rss-parser";
import type { Article, FeedConfig } from "./types.js";

const MAX_SUMMARY_LENGTH = 100;

export function toArticle(item: Parser.Item, feed: FeedConfig): Article | null {
  const title = normalizeWhitespace(item.title ?? "");
  const link = normalizeWhitespace(item.link ?? item.guid ?? "");
  const publishedAt = parsePublishedAt(item);
  const description = getItemString(item, "description");

  if (!title || !link || !publishedAt) {
    return null;
  }

  const rawDescription = description ?? item.contentSnippet ?? item.content ?? "";
  const cleanDescription = cleanText(rawDescription);

  return {
    title,
    link,
    publishedAt,
    source: feed.source,
    description: cleanDescription,
    summary: summarize(cleanDescription),
  };
}

export function isWithinLast24Hours(article: Article, now = new Date()): boolean {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  return article.publishedAt.getTime() >= cutoff && article.publishedAt.getTime() <= now.getTime();
}

export function dedupeByLink(articles: Article[]): Article[] {
  const seen = new Map<string, Article>();

  for (const article of articles) {
    const key = article.link.trim();
    if (!seen.has(key)) {
      seen.set(key, article);
    }
  }

  return [...seen.values()];
}

export function sortByNewestFirst(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

function parsePublishedAt(item: Parser.Item): Date | null {
  const rawDate = item.isoDate ?? item.pubDate;
  if (!rawDate) {
    return null;
  }

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getItemString(item: Parser.Item, key: string): string | undefined {
  const value = (item as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function summarize(text: string): string {
  const cleaned = cleanText(text);
  if (!cleaned) {
    return "暂无摘要。";
  }

  return cleaned.length > MAX_SUMMARY_LENGTH
    ? `${cleaned.slice(0, MAX_SUMMARY_LENGTH)}…`
    : cleaned;
}

function cleanText(text: string): string {
  return normalizeWhitespace(stripHtml(text));
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
