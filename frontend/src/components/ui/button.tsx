import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../features/shared/utils/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600",
        destructive:
          "bg-red-500 text-red-50 shadow hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 dark:bg-red-900 dark:text-red-50 dark:hover:bg-red-800 dark:focus-visible:ring-red-300",
        outline:
          "border border-slate-300 bg-transparent text-slate-900 shadow hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-500",
        secondary:
          "bg-slate-100 text-slate-900 shadow hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost:
          "bg-transparent text-slate-900 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-100 dark:hover:bg-slate-800",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
