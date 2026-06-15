import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Input({ className, type = "text", error, leftIcon, rightIcon, ...props }: InputProps) {
  return (
    <div className="relative w-full flex items-center group">
      {leftIcon ? (
        <div className="absolute left-3 text-muted-foreground transition-colors group-focus-within:text-foreground">
          {leftIcon}
        </div>
      ) : null}
      <input
        type={type}
        data-slot="input"
        aria-invalid={error ? "true" : undefined}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          leftIcon ? "pl-10" : "",
          rightIcon ? "pr-10" : "",
          className
        )}
        {...props}
      />
      {rightIcon ? (
        <div className="absolute right-3 text-muted-foreground transition-colors group-focus-within:text-foreground">
          {rightIcon}
        </div>
      ) : null}
    </div>
  )
}

export { Input }
