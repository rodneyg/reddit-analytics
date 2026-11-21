# Reddit Post Time Analyzer

**See when recent posts in a subreddit received the most engagement.**

This tool analyzes recent posts from a subreddit, calculates when posts get the highest combined Reddit scores and comment counts, and visualizes the best posting times with a heatmap, a top-times list, and a summary based on the observed scores.

---

## 🔍 What It Does

- Choose a range of **1, 3, 7, 30, or 90 days**. The frontend sends that choice. The default backend analyzes the latest available posts regardless of the selected range.
- See average engagement (Reddit post score plus comment count) in a heatmap and ranked list of the top three time slots. The list and heatmap tooltips show UTC and your local time.
- Read a summary of the highest- and lowest-scoring observed time slots for a single subreddit.
- Use subreddit suggestions while typing or enable Comparison Mode to compare analyses side by side.
- Download single-subreddit results as JSON, CSV, PNG, or text reports.
- Analyze up to 10 subreddits at once and export successful bulk results as JSON or CSV.

See the [changelog](CHANGELOG.md) for the history of these features.

---

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts (for visualizations)
- Vercel (frontend deployment)
- Express + Node.js *(backend via Render)*

---

## 📦 Bulk Analysis Feature

Analyze multiple subreddits at once! Switch to bulk mode and enter subreddits using any of these formats:

```
# Comma separated
technology, programming, reactjs

# Line separated
technology
programming
reactjs

# Bullet points
• technology
• programming
• reactjs

# Dashes
- technology
- programming
- reactjs

# Mixed formats work too!
technology, programming
- reactjs
• nextjs
```

**Features:**
- Up to 10 subreddits per request
- Estimated progress while the batch runs
- Tabbed interface for easy browsing between results
- Accepts subreddit names and `r/subreddit` prefixes
- JSON export and separate CSV exports for best times and heatmap data

---

## Empty results and errors

- If a subreddit has no posts to analyze, check its spelling. Try a longer range if your backend supports date filtering.
- Bulk results show failures in the affected subreddit tabs and retain successful results. The export menu is available when at least one analysis succeeds.
- If the analyzer says the backend is waking up, wait a few seconds and select **Retry**. In bulk mode, this retries the whole batch.

## 🚀 Get Started

Clone the frontend and run it locally:

```bash
git clone https://github.com/rodneyg/reddit-analytics.git
cd reddit-analytics
npm ci --legacy-peer-deps
npm run dev
```

Next.js prints the local URL when it starts.

The single and bulk API routes use the hosted analyzer backend on Render by default. To use your own backend, follow the [backend setup instructions](https://github.com/rodneyg/reddit-analyzer-backend) and change the backend URL in `lib/analyzer-backend.ts`. Set Reddit OAuth credentials on the backend.

## 🧠 How It Works

- The frontend requests up to 100 recent posts per subreddit through the analyzer backend.
- The default backend groups those posts by UTC day and hour, then averages the engagement score within each group.
- The browser displays the heatmap and the three highest-scoring time slots when available. Single-subreddit analysis also summarizes the observed scores.

## 🙌 Credits

Built by Rodney Gainous Jr

If you found it useful:  
☕ [Support on Ko-fi](https://ko-fi.com/rg2official)

⸻

## 📄 License

MIT — use it, remix it, build on it. Attribution appreciated.

---
