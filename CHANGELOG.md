# Changelog

Dates reflect when each change merged into `main` (UTC).

## 2026-11-23

- Reject invalid subreddit names and day counts with a clear error message in single and bulk analysis. [#33](https://github.com/rodneyg/reddit-analytics/pull/33)

## 2026-11-21

- Download successful bulk results as JSON, best-times CSV, or heatmap CSV. [#25](https://github.com/rodneyg/reddit-analytics/pull/25)
- Read a summary of the highest- and lowest-scoring observed posting times, generated directly from the analysis data. [#26](https://github.com/rodneyg/reddit-analytics/pull/26)
- Explain when there are no posts to analyze, and show the correct UTC hour in heatmap tooltips and single and bulk CSV exports. [#28](https://github.com/rodneyg/reddit-analytics/pull/28)
- Add Vercel Web Analytics for page views when enabled on the project. [#29](https://github.com/rodneyg/reddit-analytics/pull/29)
- Make the time range picker keyboard accessible, label the help buttons for screen readers, and improve text contrast. [#31](https://github.com/rodneyg/reddit-analytics/pull/31)

## 2026-11-20

- Show the analyzer's name in the browser tab and link to the correct Ko-fi page. [#22](https://github.com/rodneyg/reddit-analytics/pull/22)
- Show a message and a Retry button when the analyzer backend is waking up during single or bulk analysis. [#24](https://github.com/rodneyg/reddit-analytics/pull/24)

## 2025-08-19

- Save a single-subreddit result as a PNG. [#18](https://github.com/rodneyg/reddit-analytics/pull/18)
- Compare analyses side by side, get subreddit suggestions as you type, choose from five date ranges, and use keyboard shortcuts and text exports. [#20](https://github.com/rodneyg/reddit-analytics/pull/20)

## 2025-06-26

- Fix local day and hour conversions in the best-times cards. [#16](https://github.com/rodneyg/reddit-analytics/pull/16)

## 2025-06-13

- Automatically retry eligible server errors during single and bulk analysis. [#9](https://github.com/rodneyg/reddit-analytics/pull/9)

## 2025-06-10

- Run bulk analyses in parallel batches to reduce wait times. [#10](https://github.com/rodneyg/reddit-analytics/pull/10)

## 2025-06-09

- Download single-subreddit results as JSON, best-times CSV, or heatmap CSV. [#6](https://github.com/rodneyg/reddit-analytics/pull/6)
- Analyze up to 10 subreddits in one request and browse the results in tabs. [#4](https://github.com/rodneyg/reddit-analytics/pull/4)
- Show UTC and local posting times in best-times cards and heatmap tooltips. [#2](https://github.com/rodneyg/reddit-analytics/pull/2)
