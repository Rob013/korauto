import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-[1.05rem] [&_svg]:shrink-0 active:scale-[0.985] hover:-translate-y-0.5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] overflow-hidden isolate border border-transparent bg-clip-padding",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary/95 via-primary to-primary/80 text-primary-foreground border-primary/70 hover:from-primary hover:via-primary/95 hover:to-primary/85",
        destructive:
          "bg-gradient-to-r from-destructive/90 via-destructive to-destructive/75 text-destructive-foreground border-destructive/70 hover:from-destructive hover:via-destructive/90 hover:to-destructive/80",
        outline:
          "border border-border/70 bg-gradient-to-br from-white/95 via-white/70 to-white/40 text-foreground dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-900/20 hover:border-primary/60 hover:text-primary",
        secondary:
          "bg-gradient-to-r from-secondary/90 via-secondary to-secondary/75 text-secondary-foreground border-secondary/70 hover:via-secondary/90 hover:to-secondary/80",
        ghost:
          "bg-transparent text-foreground border border-transparent hover:border-border/70 hover:bg-foreground/5 dark:hover:bg-white/5 shadow-none hover:shadow-[var(--shadow-sm)]",
        link: "text-accent underline-offset-4 hover:underline hover:translate-y-0 shadow-none border-none",
        premium:
          "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)] bg-gradient-to-r from-accent via-rose-500 to-orange-400 text-white border-white/30 hover:brightness-110 hover:border-white/60",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-10 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-3xl px-8 text-base",
        icon: "h-10 w-10 rounded-2xl",
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
