import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Article } from "./types.js";

const DEFAULT_MODEL = "claude-opus-4-8";
const CHUNK_SIZE = 10;
const MAX_CONCURRENT_REQUESTS = 2;

const SummariesSchema = z.object({
  summaries: z.array(
    z.object({
      index: z.number(),
      summary: z.string(),
    }),
  ),
});

export async function addAiSummaries(articles: Article[]): Promise<Article[]> {
  if (articles.length === 0) {
    return articles;
  }

  if (process.env.AI_SUMMARY_DISABLED === "1") {
    console.warn("AI summaries disabled by AI_SUMMARY_DISABLED=1. Using RSS descriptions instead.");
    return articles;
  }

  const client = new Anthropic();
  const chunks = chunk(articles, CHUNK_SIZE);
  const summarizedChunks = await mapWithConcurrency(chunks, MAX_CONCURRENT_REQUESTS, async (articleChunk, chunkIndex) => {
    try {
      return await summarizeChunk(client, articleChunk, chunkIndex * CHUNK_SIZE);
    } catch (error) {
      logSummaryWarning(error, articleChunk.length, chunkIndex + 1);
      return articleChunk;
    }
  });

  return summarizedChunks.flat();
}

async function summarizeChunk(client: Anthropic, articles: Article[], offset: number): Promise<Article[]> {
  const response = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(SummariesSchema),
    },
    system: "你是 AI 新闻日报编辑。基于每篇文章的标题和 RSS description，给每篇文章写一句中文总结。要求：只总结事实，不编造；每条总结不超过 60 个汉字；不要使用项目符号、编号或 Markdown。",
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          articles: articles.map((article, index) => ({
            index,
            title: article.title,
            description: article.description || "无 description",
          })),
        }),
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Claude response did not match the expected summary schema.");
  }

  const summaries = new Map(
    response.parsed_output.summaries.map((item) => [item.index, normalizeSummary(item.summary)]),
  );

  return articles.map((article, index) => ({
    ...article,
    summary: summaries.get(index) || article.summary,
  }));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function normalizeSummary(summary: string): string {
  const cleaned = summary.replace(/\s+/g, " ").trim();
  return cleaned.replace(/[。.!！?？]*$/, "。");
}

function logSummaryWarning(error: unknown, articleCount: number, chunkNumber: number): void {
  if (error instanceof Anthropic.AuthenticationError) {
    console.warn(
      `Warning: failed to generate AI summaries for chunk ${chunkNumber} (${articleCount} articles): invalid Anthropic credentials. Set ANTHROPIC_API_KEY or run ant auth login. Falling back to RSS descriptions.`,
    );
    return;
  }

  if (error instanceof Anthropic.RateLimitError) {
    console.warn(
      `Warning: failed to generate AI summaries for chunk ${chunkNumber} (${articleCount} articles): rate limited by Anthropic API. Falling back to RSS descriptions.`,
    );
    return;
  }

  if (error instanceof Anthropic.APIError) {
    console.warn(
      `Warning: failed to generate AI summaries for chunk ${chunkNumber} (${articleCount} articles): Anthropic API error ${error.status}: ${error.message}. Falling back to RSS descriptions.`,
    );
    return;
  }

  console.warn(
    `Warning: failed to generate AI summaries for chunk ${chunkNumber} (${articleCount} articles): ${error instanceof Error ? error.message : String(error)}. Falling back to RSS descriptions.`,
  );
}
