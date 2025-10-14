import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISearchBarProps {
  onSearch: (filters: any) => void;
}

export const AISearchBar = ({ onSearch }: AISearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleAISearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-car-search', {
        body: { query }
      });

      if (error) throw error;

      if (data?.filters) {
        toast.success("Search interpreted successfully!");
        onSearch(data.filters);
        setQuery("");
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error("Failed to process AI search");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAISearch();
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Try: 'BMW from 2020' or 'red sedan under 30000 euros'..."
            className="pl-10 h-12 text-base bg-background/50 backdrop-blur-sm border-2 focus:border-primary transition-all"
            disabled={isSearching}
          />
        </div>
        <Button
          onClick={handleAISearch}
          disabled={isSearching || !query.trim()}
          size="lg"
          className="h-12 px-6 gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              AI Search
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 px-1">
        ✨ Powered by Lovable AI - Describe what you're looking for in natural language
      </p>
    </div>
  );
};