import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dedupeByLink, sortByNewestFirst } from "./article.js";
import { feeds } from "./feeds.js";
import { fetchFeeds } from "./fetcher.js";
import { renderMarkdown, reportFilename } from "./markdown.js";
import { addAiSummaries } from "./summarizer.js";

async function main(): Promise<void> {
  const { results, failures } = await fetchFeeds(feeds);
  const articles = sortByNewestFirst(dedupeByLink(results.flatMap((result) => result.articles)));
  const summarizedArticles = await addAiSummaries(articles);
  const markdown = renderMarkdown(summarizedArticles);

  const outputDir = join(process.cwd(), "output");
  await mkdir(outputDir, { recursive: true });

  const outputPath = join(outputDir, reportFilename());
  await writeFile(outputPath, markdown, "utf8");

  for (const failure of failures) {
    console.warn(`Warning: failed to fetch ${failure.source}: ${failure.error.message}`);
  }

  console.log(`Generated ${outputPath}`);
  console.log(`Included ${summarizedArticles.length} articles from ${new Set(summarizedArticles.map((article) => article.source)).size} sources.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
