export async function getRedditAccessToken() {
    const {
      REDDIT_CLIENT_ID,
      REDDIT_CLIENT_SECRET,
      REDDIT_USERNAME,
      REDDIT_PASSWORD,
      REDDIT_USER_AGENT,
    } = process.env
  
    const creds = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString("base64")
  
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": REDDIT_USER_AGENT!,
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: REDDIT_USERNAME!,
        password: REDDIT_PASSWORD!,
      }).toString(),
    })
  
    const data = await res.json()
    if (!res.ok) {
      throw new Error(`Token error: ${res.status} - ${JSON.stringify(data)}`)
    }
  
    return data.access_token
  }