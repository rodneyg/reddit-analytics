# Reddit Post Time Analyzer

**Find the best time to post on any subreddit, based on real engagement data.**

This tool analyzes recent posts from a subreddit, calculates when posts get the most upvotes and comments, and visualizes the best posting times with a heatmap, a top-times list, and a summary based on the observed scores.

---

## 🔍 What It Does

- Analyze posts from the past **1, 3, 7, 30, or 90 days**.
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
- Progress indicator showing analysis status
- Tabbed interface for easy browsing between results
- Accepts subreddit names and `r/subreddit` prefixes
- Error messages for individual failed analyses and a **Retry** button if the backend is waking up
- JSON export and separate CSV exports for best times and heatmap data

---

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
- The backend filters posts to the selected date range, groups them by UTC day and hour, and averages the engagement score within each group.
- The browser displays the heatmap and the three highest-scoring time slots when available. Single-subreddit analysis also summarizes the observed scores.

## 🙌 Credits

Built by Rodney Gainous Jr

If you found it useful:  
☕ [Support on Ko-fi](https://ko-fi.com/rg2official)

⸻

## 📄 License

MIT — use it, remix it, build on it. Attribution appreciated.

---
