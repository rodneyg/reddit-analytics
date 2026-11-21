# Reddit Post Time Analyzer

**Find the best time to post on any subreddit, based on real engagement data.**

This tool analyzes recent posts from a subreddit, calculates when posts get the most upvotes and comments, and visualizes the best posting times with a heatmap, a top-times list, and a summary based on the observed scores.

---

## 🔍 What It Does

✅ Analyze engagement from the past **7 or 30 days**  
✅ Calculate score per hour/day *(upvotes + comments)*  
✅ Display a clean **heatmap** and top 3 time slots  
✅ Summarize the highest- and lowest-scoring observed times<br>
✅ Copy insights to clipboard  
✅ Share pre-filled links to any analysis  
✅ **NEW: Bulk analysis** - analyze multiple subreddits at once  
✅ Built with **Reddit OAuth API** for real-time accuracy  

---

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts (for visualizations)
- Firebase *(planned: auth + history logging)*
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
- Automatic parsing of Reddit URLs (r/subreddit, reddit.com/r/subreddit)
- Error handling for individual failed analyses

---

## 🚀 Get Started

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
	•	Summarizes the observed engagement scores in the browser
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
