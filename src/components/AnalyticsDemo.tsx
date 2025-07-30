import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent, trackPageView, trackCarView, trackSearch, trackFavorite, trackContact } from "@/utils/analytics";

export const AnalyticsDemo = () => {
  const [eventCount, setEventCount] = useState(0);

  const testEvents = [
    {
      name: "Page View",
      action: () => trackPageView("demo-car-123", { demo: true, test_event: true })
    },
    {
      name: "Car View",
      action: () => trackCarView("demo-car-456", { make: "Demo", model: "Test", year: 2024 })
    },
    {
      name: "Search",
      action: () => trackSearch("BMW", { make: "BMW", year: "2020" }, 15)
    },
    {
      name: "Add Favorite",
      action: () => trackFavorite("demo-car-789", "add")
    },
    {
      name: "Contact",
      action: () => trackContact("email", "demo-car-101")
    },
    {
      name: "Custom Event",
      action: () => trackEvent({
        action_type: "demo_test",
        page_url: "/admin-demo",
        metadata: { test: true, timestamp: Date.now() }
      })
    }
  ];

  const handleTestEvent = (eventAction: () => void) => {
    eventAction();
    setEventCount(prev => prev + 1);
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">🧪 Analytics Test</CardTitle>
        <p className="text-xs text-muted-foreground">
          Test analytics tracking - Events sent: {eventCount}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {testEvents.map((event, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleTestEvent(event.action)}
            className="w-full text-xs"
          >
            {event.name}
          </Button>
        ))}
        <div className="pt-2 text-xs text-muted-foreground">
          Check the admin dashboard analytics section to see real-time data!
        </div>
      </CardContent>
    </Card>
  );
};