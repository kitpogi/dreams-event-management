import * as React from "react"
import { cva } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
      variant: {
        default: "text-current",
        primary: "text-primary",
        secondary: "text-secondary",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

const Spinner = React.forwardRef(({ 
  className, 
  size, 
  variant,
  asIcon = false,
  ...props 
}, ref) => {
  if (asIcon) {
    return (
      <Loader2
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        {...props}
      />
    )
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className={cn(spinnerVariants({ size, variant }))} />
    </div>
  )
})
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
export default Spinner

