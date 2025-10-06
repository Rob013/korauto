import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { iosNative } from '@/utils/iosNative';
import { useHaptics } from '@/hooks/useHaptics';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

/**
 * Share button with iOS native share sheet support
 */
export const ShareButton = ({ title, text, url, className }: ShareButtonProps) => {
  const { impact } = useHaptics();

  const handleShare = async () => {
    await impact('light');
    
    await iosNative.share({
      title: title || 'KORAUTO',
      text: text || 'Check out this car!',
      url: url || window.location.href,
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={className}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
};
