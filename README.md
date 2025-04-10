# Reddit Post Time Analyzer

**Find the best time to post on any subreddit, based on real engagement data.**

This tool analyzes recent posts from a subreddit, calculates when posts get the most upvotes and comments, and visualizes the best posting times with a heatmap, a top-times list, and GPT-powered strategic insights.

---

## 🔍 What It Does

✅ Analyze engagement from the past **7 or 30 days**  
✅ Calculate score per hour/day *(upvotes + comments)*  
✅ Display a clean **heatmap** and top 3 time slots  
✅ Generate GPT-powered strategy summaries  
✅ Copy insights to clipboard  
✅ Share pre-filled links to any analysis  
✅ Built with **Reddit OAuth API** for real-time accuracy  

---

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts (for visualizations)
- OpenAI API (strategic insights)
- Firebase *(planned: auth + history logging)*
- Vercel (frontend deployment)
- Express + Node.js *(backend via Render)*

---

## 🚀 Get Started

### 1. Clone this repo

```bash
git clone https://github.com/yourusername/reddit-analyzer.git
cd reddit-analyzer
npm install
```

### 2. Deploy your own backend

Use the provided backend repo to handle Reddit OAuth securely:

🔗 https://github.com/rodneyg/reddit-analyzer-backend

Deploy it on Render, set these environment variables:

```
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

### 3. Connect frontend to backend

Update your frontend API route (e.g. route.ts) to point to your backend’s Render URL:

```javascript
const BASE_URL = "https://your-backend.onrender.com"
```

### 4. Start frontend locally

```bash
npm run dev
```

Then visit http://localhost:3000

⸻

## 🧠 How It Works
	•	Fetches latest ~500 Reddit posts using Reddit OAuth API
	•	Aggregates post scores by day and hour (UTC)
	•	Builds a day/hour heatmap of average engagement
	•	Filters low-signal data for clarity
	•	Ranks top 3 time slots with highest average score
	•	Uses OpenAI to write a concise posting strategy
	•	Supports clipboard copy + shareable links

⸻

## 🙌 Credits

Built by Rodney Gainous Jr

If you found it useful:  
☕ Support on Ko-fi

⸻

## 📄 License

MIT — use it, remix it, build on it. Attribution appreciated.

---
