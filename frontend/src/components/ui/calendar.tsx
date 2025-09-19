import * as React from "react"
import { cn } from "@/features/shared/utils/utils"

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  mode?: "single"
  initialFocus?: boolean
}

export function Calendar({
  className,
  selected,
  onSelect,
  mode = "single",
  initialFocus,
  ...props
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date())
  const [viewDate, setViewDate] = React.useState(new Date())

  const today = new Date()
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Get first day of month and how many days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDate = firstDay.getDay() // 0 = Sunday

  // Generate calendar days
  const days = []

  // Previous month's trailing days
  for (let i = 0; i < startDate; i++) {
    const prevDate = new Date(year, month, -startDate + i + 1)
    days.push({ date: prevDate, isCurrentMonth: false })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push({ date, isCurrentMonth: true })
  }

  // Next month's leading days
  const remainingDays = 42 - days.length // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const nextDate = new Date(year, month + 1, i)
    days.push({ date: nextDate, isCurrentMonth: false })
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    onSelect?.(date)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const months = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ]

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  return (
    <div className={cn("p-3", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-accent rounded"
        >
          ←
        </button>
        <div className="font-semibold">
          {year}年 {months[month]}
        </div>
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-accent rounded"
        >
          →
        </button>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayInfo, index) => {
          const { date, isCurrentMonth } = dayInfo
          const isSelected = selected &&
            date.getDate() === selected.getDate() &&
            date.getMonth() === selected.getMonth() &&
            date.getFullYear() === selected.getFullYear()
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={cn(
                "p-2 text-sm hover:bg-accent rounded text-center",
                !isCurrentMonth && "text-muted-foreground",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday && !isSelected && "bg-accent font-semibold"
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}