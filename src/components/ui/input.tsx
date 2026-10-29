import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "motion-standard file:text-foreground placeholder:text-muted-foreground/75 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-background px-2.5 py-1.5 text-base transition-[color,background-color,border-color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-primary/30 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 md:text-sm",
        "focus-visible:border-ring focus-visible:bg-background focus-visible:ring-ring/40 focus-visible:ring-2",
        "aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
