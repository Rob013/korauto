import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "button-shine relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-transparent px-5 py-2.5 text-sm font-semibold tracking-wide transition-[background,transform,border,color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-[1.05rem] [&_svg]:shrink-0 active:scale-[0.985] hover:-translate-y-0.5 will-change-transform shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)]",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background border-foreground/15 dark:border-foreground/35",
        destructive:
          "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-[hsl(var(--foreground))]/45 hover:bg-[hsl(var(--foreground))]/10",
        outline:
          "bg-transparent text-foreground border-foreground/35 hover:bg-foreground/5",
        secondary:
          "bg-muted text-foreground border-border hover:bg-muted/80 dark:bg-muted/40 dark:text-foreground",
        ghost:
          "bg-transparent text-foreground border border-transparent shadow-none hover:border-foreground/20 hover:bg-foreground/5",
        link: "button-link text-foreground underline-offset-4 hover:underline shadow-none border-none px-0 py-0 h-auto hover:-translate-y-0 focus-visible:ring-0 focus-visible:ring-offset-0",
        premium:
          "bg-gradient-to-r from-foreground via-foreground/85 to-foreground/60 text-background border-foreground/25",
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
