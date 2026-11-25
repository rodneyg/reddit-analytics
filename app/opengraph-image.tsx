import { ImageResponse } from 'next/og'

export const alt = 'Reddit Post Time Analyzer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#ff4500',
          color: 'white',
          fontSize: 76,
          fontWeight: 700,
        }}
      >
        <div>Reddit Post Time Analyzer</div>
        <div style={{ fontSize: 38, fontWeight: 400, marginTop: 24 }}>
          Find the best time to post on your favorite subreddit.
        </div>
      </div>
    ),
    size,
  )
}
