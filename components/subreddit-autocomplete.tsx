"use client"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
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
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    setSuggestions(getSubredditSuggestions(inputValue, 8))
  }, [inputValue])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setInputValue(selectedValue)
    setOpen(false)
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onValueChange(newValue)
    if (newValue.length > 0 && !open) {
      setOpen(true)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Command className="rounded-lg border border-input">
            <CommandInput
              placeholder={placeholder}
              value={inputValue}
              onValueChange={handleInputChange}
              onFocus={() => setOpen(true)}
              className="border-0"
            />
          </Command>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" sideOffset={4}>
        <Command>
          <CommandList>
            {suggestions.length === 0 && inputValue.length > 0 ? (
              <CommandEmpty>No subreddits found.</CommandEmpty>
            ) : (
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
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}