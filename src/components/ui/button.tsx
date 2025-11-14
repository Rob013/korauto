import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border/60 bg-white/80 text-sm font-semibold tracking-tight text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 supports-[backdrop-filter]:backdrop-blur-md dark:bg-white/5 dark:text-white/90 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:translate-y-0 active:scale-[0.98] will-change-transform",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary/95 via-primary to-primary/90 text-primary-foreground border-primary/40 shadow-[var(--shadow-md)] hover:from-primary hover:via-primary/95 hover:to-primary/95 dark:from-primary/80 dark:via-primary/70 dark:to-primary/60",
        destructive:
          "bg-gradient-to-r from-destructive via-destructive to-destructive/85 text-destructive-foreground border-destructive/40 shadow-[var(--shadow-md)] hover:from-destructive/95 hover:to-destructive/90",
        outline:
          "bg-white/80 text-foreground border-border/70 shadow-[var(--shadow-sm)] hover:bg-white dark:bg-white/10 dark:text-white/90 dark:border-white/20 dark:hover:bg-white/15",
        secondary:
          "bg-gradient-to-r from-secondary/85 via-secondary to-secondary/70 text-secondary-foreground border-secondary/30 shadow-[var(--shadow-md)] hover:from-secondary hover:to-secondary/85",
        ghost:
          "border-transparent bg-transparent text-foreground/80 shadow-none hover:bg-foreground/5 hover:text-foreground dark:text-white/80 dark:hover:bg-white/10",
        link:
          "border-none bg-transparent px-0 shadow-none text-primary underline-offset-4 hover:underline hover:shadow-none hover:translate-y-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none",
        premium:
          "bg-gradient-to-r from-accent to-accent/80 text-accent-foreground border-accent/40 shadow-[var(--shadow-lg)] hover:from-accent/90 hover:to-accent/70 hover:shadow-[var(--shadow-xl)]",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
