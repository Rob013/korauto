import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AISearchResult {
  filters: any;
  suggestions: string[];
  processedQuery: string;
}

export const useAICarSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const searchWithAI = async (query: string, userBehavior?: any[]): Promise<AISearchResult | null> => {
    if (!query.trim()) return null;
    
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-car-search', {
        body: { query, userBehavior }
      });

      if (error) {
        console.error('AI Search error:', error);
        return null;
      }

      setSuggestions(data.suggestions || []);
      return data;
    } catch (error) {
      console.error('AI Search failed:', error);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const clearSuggestions = () => setSuggestions([]);

  return {
    searchWithAI,
    isSearching,
    suggestions,
    clearSuggestions
  };
};