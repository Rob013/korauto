import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { useGlobalProgress } from "@/contexts/ProgressContext";

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ onValueChange, id, ...props }, ref) => {
  const [isPending, startTransition] = React.useTransition();
  const { startProgress, completeProgress } = useGlobalProgress();
  const generatedId = React.useId();
  const tabsProgressKey = React.useMemo(
    () => `tabs-${id ?? generatedId}`,
    [id, generatedId],
  );

  React.useEffect(() => {
    if (!isPending) {
      completeProgress(tabsProgressKey);
    }
  }, [isPending, completeProgress, tabsProgressKey]);

  const handleValueChange = React.useCallback(
    (value: string) => {
      startProgress({
        key: tabsProgressKey,
        autoCompleteMs: 900,
      });

      startTransition(() => {
        onValueChange?.(value);
      });
    },
    [onValueChange, startProgress, tabsProgressKey],
  );

  return (
    <TabsPrimitive.Root
      ref={ref}
      id={id}
      onValueChange={handleValueChange}
      data-tabs-pending={isPending ? "true" : "false"}
      {...props}
    />
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 motion-reduce:transition-none data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-0 data-[state=inactive]:absolute data-[state=inactive]:-z-10 data-[state=inactive]:h-0 data-[state=inactive]:overflow-hidden data-[state=active]:opacity-100 data-[state=active]:relative data-[state=active]:z-0 tabs-content-animate",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
