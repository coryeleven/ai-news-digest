# AI News Digest CLI

一个用 TypeScript 编写的 AI 新闻聚合 CLI 工具。它会抓取多个 AI 相关 RSS 源中过去 24 小时的文章，使用 Claude 基于标题和 RSS description 生成一句话中文摘要，并输出 Markdown 日报。

## 功能

- 抓取最近 24 小时的 AI 新闻
- 支持 RSS 源：
  - TechCrunch AI
  - The Verge AI
  - Hacker News AI newest 前 30 条
- 提取标题、链接、发布时间、来源和 description
- 使用 Claude 生成一句话中文摘要
- 按发布时间倒序排列
- 按链接去重
- 在日报开头输出统计信息：共收录文章数、来源数
- 生成 Markdown 文件到 `output/` 目录
- 单个 RSS 源或单批 AI 摘要失败时自动降级，不中断整份日报生成

## 环境要求

- Node.js 20+
- npm
- Anthropic API Key，或已通过 `ant auth login` 登录的本地 Anthropic 凭据

## 安装

```bash
npm install
```

## 配置

启用 Claude AI 摘要需要配置：

```bash
export ANTHROPIC_API_KEY=你的_api_key
```

可选配置：

```bash
# 覆盖默认 Claude 模型
export ANTHROPIC_MODEL=claude-opus-4-8

# 临时关闭 AI 摘要，使用 RSS description 截断摘要
export AI_SUMMARY_DISABLED=1
```

默认模型是：

```txt
claude-opus-4-8
```

## 使用

运行 CLI：

```bash
npm run dev
```

或：

```bash
npm start
```

生成文件示例：

```txt
output/ai-news-digest-2026-06-10.md
```

如果没有配置 Anthropic 凭据，AI 摘要请求会失败并回退到 RSS description 摘要；也可以显式关闭 AI 摘要：

```bash
AI_SUMMARY_DISABLED=1 npm run dev
```

## 开发命令

类型检查：

```bash
npm run check
```

当前项目暂未配置 lint 或测试脚本。

## 输出格式

日报包含：

```md
# AI News Digest - YYYY-MM-DD

Generated at: YYYY-MM-DD, HH:mm

## 统计

- 共收录 X 篇
- 来自 Y 个源

## 1. Article title

- Source: TechCrunch AI
- Published: YYYY-MM-DD, HH:mm
- Summary: 一句话中文摘要。
- Link: https://example.com/article
```

## 项目结构

```txt
src/
├── article.ts      # RSS item 标准化、24 小时过滤、去重、排序
├── feeds.ts        # RSS 源配置
├── fetcher.ts      # 并发抓取和解析 RSS
├── index.ts        # CLI 入口和整体流程编排
├── markdown.ts     # Markdown 日报渲染
├── summarizer.ts   # Claude AI 摘要生成和失败回退
└── types.ts        # 共享类型定义
```

## 工作流程

1. 从 `src/feeds.ts` 读取 RSS 源配置
2. 通过 `rss-parser` 并发抓取 RSS
3. 将 RSS item 转换成统一的 `Article` 结构
4. 过滤最近 24 小时内的文章
5. 按链接去重并按发布时间倒序排序
6. 分批调用 Claude，为每篇文章生成一句话摘要
7. 渲染 Markdown 日报
8. 写入 `output/ai-news-digest-YYYY-MM-DD.md`

## GitHub

仓库地址：

```txt
https://github.com/coryeleven/ai-news-digest
```
