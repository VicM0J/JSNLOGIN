import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  uppercase?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, uppercase = false, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (uppercase) {
        const cursorPosition = e.target.selectionStart;
        e.target.value = e.target.value.toUpperCase();
        setTimeout(() => {
          e.target.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
      }
      onChange?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
