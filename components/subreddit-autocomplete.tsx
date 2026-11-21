"use client"

import { useState, useEffect, useRef } from "react"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSubredditSuggestions } from "@/lib/subreddit-suggestions"

interface SubredditAutocompleteProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SubredditAutocomplete({ value, onValueChange, placeholder = "Enter subreddit name", className }: SubredditAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSuggestions(getSubredditSuggestions(value, 8))
  }, [value])

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
    // Focus back to input after selection
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onValueChange(newValue)
    
    // Show suggestions if there's input and suggestions exist
    if (newValue.length > 0) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const handleInputFocus = () => {
    if (value.length > 0 && suggestions.length > 0) {
      setOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay closing to allow click on suggestions
    setTimeout(() => {
      setOpen(false)
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        className="w-full"
      />
      
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <Command>
            <CommandList className="max-h-60 overflow-auto">
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => handleSelect(suggestion)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">r/</span>
                      <span>{suggestion}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === suggestion ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}