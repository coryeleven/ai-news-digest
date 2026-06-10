import type { Article } from "./types.js";

export function renderMarkdown(articles: Article[], generatedAt = new Date()): string {
  const date = formatDate(generatedAt);
  const generatedTime = formatDateTime(generatedAt);
  const sourceCount = new Set(articles.map((article) => article.source)).size;

  const lines = [
    `# AI News Digest - ${date}`,
    "",
    `Generated at: ${generatedTime}`,
    "",
    "## 统计",
    "",
    `- 共收录 ${articles.length} 篇`,
    `- 来自 ${sourceCount} 个源`,
    "",
  ];

  if (articles.length === 0) {
    lines.push("No AI articles found in the last 24 hours.", "");
    return lines.join("\n");
  }

  articles.forEach((article, index) => {
    lines.push(
      `## ${index + 1}. ${escapeMarkdown(article.title)}`,
      "",
      `- Source: ${article.source}`,
      `- Published: ${formatDateTime(article.publishedAt)}`,
      `- Summary: ${escapeMarkdown(article.summary)}`,
      `- Link: ${article.link}`,
      "",
    );
  });

  return lines.join("\n");
}

export function reportFilename(date = new Date()): string {
  return `ai-news-digest-${formatDate(date)}.md`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function escapeMarkdown(text: string): string {
  return text.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}
