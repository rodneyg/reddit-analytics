import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timezone utilities for converting UTC times to local times
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const date = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    })
    const parts = formatter.formatToParts(date)
    return parts.find(part => part.type === 'timeZoneName')?.value || timezone
  } catch {
    return timezone
  }
}

export function convertUtcToLocal(day: number, hour: number, timezone: string): { day: number, hour: number } {
  try {
    // Create a UTC date for the given day/hour
    // We'll use a reference week starting with Sunday (2024-01-07 is a Sunday)
    const referenceSunday = new Date('2024-01-07T00:00:00Z')
    const utcDate = new Date(referenceSunday.getTime() + (day * 24 * 60 * 60 * 1000) + (hour * 60 * 60 * 1000))
    
    // Get the local time in the target timezone
    const localTimeString = utcDate.toLocaleString('en-CA', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    // Parse the local time string to get a proper Date object
    const localDate = new Date(localTimeString + 'Z') // Add Z to treat as UTC for parsing
    
    return {
      day: localDate.getUTCDay(),
      hour: localDate.getUTCHours()
    }
  } catch (error) {
    console.warn('Timezone conversion failed, falling back to UTC:', error)
    // Fallback to UTC if conversion fails
    return { day, hour }
  }
}

export function formatTimeWithTimezone(day: string, hour: number, timezone: string, showTimezone = true): string {
  const formattedHour = hour % 12 || 12
  const amPm = hour < 12 ? "AM" : "PM"
  const timeStr = `${day} ${formattedHour}${amPm}`
  
  if (showTimezone) {
    const tzAbbr = getTimezoneAbbreviation(timezone)
    return `${timeStr} ${tzAbbr}`
  }
  
  return timeStr
}

// Utility to parse bulk subreddit input from various formats
export function parseSubreddits(input: string): string[] {
  if (!input.trim()) {
    return []
  }

  // Remove common prefixes
  const cleaned = input
    .replace(/reddit\.com\/r\//g, '') // Remove full reddit URLs first
    .replace(/\/r\//g, '') // Remove /r/ prefix
    .replace(/r\//g, '') // Remove r/ prefix

  // Split by various delimiters and clean
  const subreddits = cleaned
    .split(/[,\n\r\-•·*\s]+/) // Split by commas, newlines, dashes, bullets, asterisks, spaces
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== '-' && s !== '•' && s !== '*') // Remove empty strings and delimiter artifacts
    .map(s => s.toLowerCase())

  // Remove duplicates
  return [...new Set(subreddits)]
}
