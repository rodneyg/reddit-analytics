// Popular subreddits categorized by topic for auto-suggestions
export const popularSubreddits = [
  // Technology
  'technology', 'programming', 'webdev', 'javascript', 'reactjs', 'frontend', 'backend',
  'machinelearning', 'artificial', 'Python', 'learnprogramming', 'coding', 'computerscience',
  'softwareengineering', 'cscareerquestions', 'node', 'angular', 'vue', 'golang', 'rust',
  
  // Business & Finance
  'entrepreneur', 'startups', 'business', 'investing', 'personalfinance', 'financialindependence',
  'stocks', 'cryptocurrency', 'marketing', 'sales', 'smallbusiness',
  
  // Gaming
  'gaming', 'pcgaming', 'nintendo', 'playstation', 'xbox', 'steam', 'gamedev', 'indiegaming',
  
  // Lifestyle & Hobbies
  'photography', 'art', 'design', 'music', 'movies', 'books', 'cooking', 'fitness', 'travel',
  'diy', 'lifehacks', 'productivity', 'minimalism',
  
  // News & Discussion  
  'news', 'worldnews', 'politics', 'science', 'space', 'history', 'todayilearned', 'askreddit',
  'explainlikeimfive', 'changemyview', 'unpopularopinion',
  
  // Entertainment
  'funny', 'memes', 'dankmemes', 'videos', 'gifs', 'interestingasfuck', 'nextfuckinglevel',
  'oddlysatisfying', 'mildlyinteresting',
  
  // Advice & Support
  'lifeadvice', 'relationship_advice', 'legaladvice', 'personalfinance', 'getmotivated',
  'decidingtobebetter', 'selfimprovement'
].sort()

// Get subreddit suggestions based on input
export function getSubredditSuggestions(input: string, limit: number = 10): string[] {
  if (!input.trim()) {
    return popularSubreddits.slice(0, limit)
  }
  
  const query = input.toLowerCase().trim()
  
  // Exact matches first, then starts with, then contains
  const exactMatches = popularSubreddits.filter(sub => sub.toLowerCase() === query)
  const startsWithMatches = popularSubreddits.filter(sub => 
    sub.toLowerCase().startsWith(query) && sub.toLowerCase() !== query
  )
  const containsMatches = popularSubreddits.filter(sub => 
    sub.toLowerCase().includes(query) && 
    !sub.toLowerCase().startsWith(query) && 
    sub.toLowerCase() !== query
  )
  
  return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, limit)
}