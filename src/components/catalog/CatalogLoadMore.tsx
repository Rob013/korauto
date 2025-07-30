import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CatalogLoadMoreProps {
  hasMorePages: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

const CatalogLoadMore = ({ hasMorePages, loading, onLoadMore }: CatalogLoadMoreProps) => {
  if (!hasMorePages) return null;

  const handleLoadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    onLoadMore();
  };

  return (
    <div className="flex justify-center mt-8" id="load-more-section">
      <Button
        onClick={handleLoadMore}
        disabled={loading}
        variant="outline"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </>
        ) : (
          'Load More Cars'
        )}
      </Button>
    </div>
  );
};

export default CatalogLoadMore;