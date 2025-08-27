import * as React from "react"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Separator({ className = "", ...props }: SeparatorProps) {
  return (
    <div
      className={`shrink-0 bg-border h-[1px] w-full ${className}`}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  )
}

