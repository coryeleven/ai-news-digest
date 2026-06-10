# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install dependencies: `npm install`
- Run the CLI: `npm run dev`
- Run the CLI via the start alias: `npm start`
- Type-check the project: `npm run check`
- Run without Claude API summaries: `AI_SUMMARY_DISABLED=1 npm run dev`

There is currently no lint script or test runner configured. If tests are added later, also add the corresponding scripts to `package.json` and update this file with the full suite and single-test commands.

## Runtime configuration

The CLI uses the official Anthropic TypeScript SDK for AI summaries.

- `ANTHROPIC_API_KEY` or an `ant auth login` profile is required for AI summaries.
- `ANTHROPIC_MODEL` optionally overrides the default model, currently `claude-opus-4-8`.
- `AI_SUMMARY_DISABLED=1` skips Claude calls and falls back to RSS description snippets.

Generated reports are written to `output/`, which is intentionally ignored by git.

## Architecture

This is a small TypeScript ESM CLI run directly with `tsx`. The entrypoint is `src/index.ts`, which orchestrates the pipeline:

1. Fetch configured RSS feeds from `src/feeds.ts` through `fetchFeeds()` in `src/fetcher.ts`.
2. Normalize RSS items into `Article` objects in `src/article.ts`.
3. Filter to the last 24 hours, deduplicate by link, and sort newest-first.
4. Enrich articles with Claude-generated one-sentence summaries through `src/summarizer.ts`.
5. Render the final Markdown report with stats through `src/markdown.ts` and write it under `output/`.

Important behavior to preserve:

- RSS fetching uses `Promise.allSettled`, so one failing feed should not fail the entire report.
- Items without title, link, or parseable publish time are skipped.
- `description` is kept separately from `summary`: `description` is cleaned RSS content used as AI input; `summary` is what appears in Markdown.
- AI summarization is batched in groups of 10 with at most 2 concurrent Anthropic requests. A failed batch falls back to the existing RSS-derived summaries instead of aborting the run.
- Markdown stats count included articles and distinct sources after filtering/deduplication/summarization.
