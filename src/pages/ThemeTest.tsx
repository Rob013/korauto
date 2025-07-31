import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Star, ShoppingCart, Search, User, Bell } from "lucide-react";

const ThemeTest = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Theme Test - Your Design System</h1>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Typography Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Typography & Fonts</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Heading 1 - SF Pro Rounded</h1>
            <h2 className="text-3xl font-semibold text-foreground">Heading 2 - Medium Weight</h2>
            <h3 className="text-2xl font-medium text-foreground">Heading 3 - Regular</h3>
            <p className="text-lg text-foreground">Large paragraph text in primary color (#111827)</p>
            <p className="text-base text-muted-foreground">Regular paragraph text in muted color (#6B7280)</p>
            <p className="text-sm text-muted-foreground">Small text for captions and metadata</p>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-background border border-border rounded-theme"></div>
              <p className="text-sm text-muted-foreground">Background</p>
              <p className="text-xs text-muted-foreground">#F9FAFB</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-foreground rounded-theme"></div>
              <p className="text-sm text-muted-foreground">Primary Text</p>
              <p className="text-xs text-muted-foreground">#111827</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-muted rounded-theme"></div>
              <p className="text-sm text-muted-foreground">Muted Text</p>
              <p className="text-xs text-muted-foreground">#6B7280</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-primary rounded-theme"></div>
              <p className="text-sm text-muted-foreground">Primary Button</p>
              <p className="text-xs text-muted-foreground">#1D4ED8</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-card border border-border rounded-theme"></div>
              <p className="text-sm text-muted-foreground">Card Background</p>
              <p className="text-xs text-muted-foreground">#FFFFFF</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-border rounded-theme"></div>
              <p className="text-sm text-muted-foreground">Border Color</p>
              <p className="text-xs text-muted-foreground">#E5E7EB</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-accent rounded-theme"></div>
              <p className="text-sm text-muted-foreground">Accent Hover</p>
              <p className="text-xs text-muted-foreground">#2563EB</p>
            </div>
          </div>
        </section>

        {/* Button Styles Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Button Styles</h2>
          <div className="flex flex-wrap gap-4">
            <Button className="rounded-full px-5 py-2.5 font-medium">
              Primary Button
            </Button>
            <Button variant="secondary" className="rounded-full px-5 py-2.5 font-medium">
              Secondary Button
            </Button>
            <Button variant="outline" className="rounded-full px-5 py-2.5 font-medium">
              Outline Button
            </Button>
            <Button variant="ghost" className="rounded-full px-5 py-2.5 font-medium">
              Ghost Button
            </Button>
            <Button className="rounded-full px-5 py-2.5 font-medium" disabled>
              Disabled Button
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button size="sm" className="rounded-full px-4 py-2 font-medium">
              Small Button
            </Button>
            <Button size="lg" className="rounded-full px-6 py-3 font-medium">
              Large Button
            </Button>
            <Button className="rounded-full px-5 py-2.5 font-medium">
              <ShoppingCart className="h-4 w-4 mr-2" />
              With Icon
            </Button>
          </div>
        </section>

        {/* Card Layout Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Card Layouts</h2>
          
          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="rounded-theme-lg shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <CardHeader className="p-6">
                  <div className="h-48 bg-secondary rounded-theme mb-4"></div>
                  <CardTitle className="text-lg font-semibold">Product Card {item}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    This is a description of the product with muted text color.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-foreground">$299</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground ml-1">4.5</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="rounded-full">Featured</Badge>
                    <Badge variant="outline" className="rounded-full">New</Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <div className="flex gap-2 w-full">
                    <Button className="flex-1 rounded-full font-medium">
                      Add to Cart
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Form Elements Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Form Elements</h2>
          <Card className="rounded-theme-lg shadow-[0_1px_4px_rgba(0,0,0,0.05)] max-w-md">
            <CardHeader className="p-6">
              <CardTitle>Contact Form</CardTitle>
              <CardDescription>Get in touch with us using the form below.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter your full name" 
                  className="rounded-theme"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  className="rounded-theme"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Write your message here..." 
                  className="rounded-theme min-h-[100px]"
                />
              </div>
              <Button className="w-full rounded-full font-medium">
                Send Message
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Spacing & Layout Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-foreground">Spacing & Layout</h2>
          
          {/* Consistent Padding Examples */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Padding Examples</h3>
            <div className="space-y-4">
              <Card className="rounded-theme-lg shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="p-4 bg-secondary/20 rounded-theme">
                  <p className="text-sm text-muted-foreground">16px padding (p-4)</p>
                </div>
              </Card>
              <Card className="rounded-theme-lg shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="p-6 bg-secondary/20 rounded-theme">
                  <p className="text-sm text-muted-foreground">24px padding (p-6)</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Gap Examples */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Gap Examples</h3>
            <div className="flex gap-4">
              <div className="p-4 bg-secondary/20 rounded-theme">gap-4</div>
              <div className="p-4 bg-secondary/20 rounded-theme">gap-4</div>
              <div className="p-4 bg-secondary/20 rounded-theme">gap-4</div>
            </div>
            <div className="flex gap-6">
              <div className="p-4 bg-secondary/20 rounded-theme">gap-6</div>
              <div className="p-4 bg-secondary/20 rounded-theme">gap-6</div>
              <div className="p-4 bg-secondary/20 rounded-theme">gap-6</div>
            </div>
          </div>
        </section>

        {/* Border Radius & Shadows */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Border Radius & Shadows</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-theme shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">12px Radius</h3>
                <p className="text-sm text-muted-foreground">Standard card border radius</p>
              </CardContent>
            </Card>
            <Card className="rounded-theme-lg shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">16px Radius</h3>
                <p className="text-sm text-muted-foreground">Large border radius for prominent cards</p>
              </CardContent>
            </Card>
            <Card className="rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Full Radius</h3>
                <p className="text-sm text-muted-foreground">For buttons and pills</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mobile Responsive Test */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Mobile Responsive Layout</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <Card key={item} className="rounded-theme-lg shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <CardContent className="p-4">
                  <div className="h-24 bg-secondary rounded-theme mb-3"></div>
                  <h4 className="font-medium text-sm">Item {item}</h4>
                  <p className="text-xs text-muted-foreground">Responsive grid item</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ThemeTest;