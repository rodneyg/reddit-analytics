type EscapeKeyEvent = {
  key: string
  stopPropagation: () => void
}

export function stopEscapePropagation(event: EscapeKeyEvent) {
  if (event.key !== "Escape") return false

  event.stopPropagation()
  return true
}
