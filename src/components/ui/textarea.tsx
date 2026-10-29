import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "motion-standard border-input placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:bg-input/30 flex field-sizing-content min-h-20 w-full rounded-md border bg-background px-2.5 py-2 text-base transition-[color,background-color,border-color,box-shadow] outline-none hover:border-primary/30 focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
