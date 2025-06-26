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
    
    // Use formatToParts for reliable parsing
    const localDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(utcDate)
    
    // Extract parts safely
    const year = localDateParts.find(p => p.type === 'year')?.value
    const month = localDateParts.find(p => p.type === 'month')?.value
    const dayPart = localDateParts.find(p => p.type === 'day')?.value
    const hourPart = localDateParts.find(p => p.type === 'hour')?.value
    const minute = localDateParts.find(p => p.type === 'minute')?.value || '00'
    const second = localDateParts.find(p => p.type === 'second')?.value || '00'
    
    // Ensure all parts are available
    if (!year || !month || !dayPart || !hourPart) {
      throw new Error('Failed to extract date parts')
    }
    
    // Create ISO string and parse
    const isoString = `${year}-${month}-${dayPart}T${hourPart}:${minute}:${second}.000Z`
    const localDate = new Date(isoString)
    
    // Validate the parsed date
    if (isNaN(localDate.getTime())) {
      throw new Error('Invalid date created from parts')
    }
    
    const resultDay = localDate.getUTCDay()
    const resultHour = localDate.getUTCHours()
    
    // Validate results are within expected ranges
    if (resultDay < 0 || resultDay > 6 || resultHour < 0 || resultHour > 23) {
      throw new Error('Invalid day or hour result')
    }
    
    return {
      day: resultDay,
      hour: resultHour
    }
  } catch (error) {
    console.warn('Timezone conversion failed, falling back to UTC:', error)
    // Fallback to UTC if conversion fails - ensure valid values
    return { 
      day: Math.max(0, Math.min(6, day)), 
      hour: Math.max(0, Math.min(23, hour)) 
    }
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

// Export utilities
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, filename, 'application/json')
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  downloadFile(csvContent, filename, 'text/csv')
}
