import * as React from "react"

import { cn } from "@/lib/utils"

const Chart = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  )
}
Chart.displayName = "Chart"

interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom"
  align?: "start" | "center" | "end"
  arrowOffset?: number
  disableAnimation?: boolean
}

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
})
ChartTooltip.displayName = "ChartTooltip"

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col space-y-1", className)} ref={ref} {...props}>
        {children}
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

interface ChartTooltipItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
}

const ChartTooltipItem = React.forwardRef<HTMLDivElement, ChartTooltipItemProps>(
  ({ className, label, value, ...props }, ref) => {
    return (
      <div className={cn("flex items-center justify-between space-x-2", className)} ref={ref} {...props}>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    )
  },
)
ChartTooltipItem.displayName = "ChartTooltipItem"

export { Chart, ChartTooltip, ChartTooltipContent, ChartTooltipItem }
