# Reddit Post Time Analyzer

Find the best time to post on any subreddit, based on real engagement data.

This tool analyzes recent posts from a subreddit, calculates when posts get the most upvotes and comments, and visualizes the best posting times with a heatmap, a top-times list, and GPT-powered strategic insights.

---

## 🔍 What It Does

- ✅ Analyze engagement from the past 7 or 30 days
- ✅ Calculate score per hour/day (score + comments)
- ✅ Display a clean heatmap and top 3 time slots
- ✅ Summarize strategy using OpenAI
- ✅ Copy insights to clipboard
- ✅ Share a pre-filled link to your analysis
- ✅ Built with real Reddit API (OAuth) for accuracy

---

## 🛠 Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/) (planned auth/history)
- [Recharts](https://recharts.org/) for visualization
- [OpenAI API](https://platform.openai.com/) for insights
- [Vercel](https://vercel.com/) for deployment

---

## 🚀 Get Started

1. Clone the repo

```bash
git clone https://github.com/yourusername/reddit-analyzer.git
cd reddit-analyzer
```

2. Install dependencies

```bash
npm install
```

3. Create `.env.local` with your API keys

```
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
OPENAI_API_KEY=your_openai_key
```

4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🧠 How It Works

- Fetches latest 500 Reddit posts for a subreddit
- Aggregates by day + hour UTC
- Filters low-signal bins to reduce visual noise
- Calculates top engagement slots
- Uses OpenAI to summarize posting strategy
- Supports shareable links and clipboard copy

---

## 🙌 Credits

Built by Rodney Gainous Jr  
If you found it useful: ☕ [Support on Ko-fi](https://ko-fi.com/)

---

## 📄 License

MIT — do what you want, but attribution appreciated.
```
