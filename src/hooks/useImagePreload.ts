import { useEffect, useState } from 'react';

export const useImagePreload = (imageSrc: string | undefined) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!imageSrc) {
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    
    const handleLoad = () => {
      setIsLoaded(true);
      setIsError(false);
    };
    
    const handleError = () => {
      setIsError(true);
      setIsLoaded(true);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    
    img.src = imageSrc;

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [imageSrc]);

  return { isLoaded, isError };
};

export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach(url => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

export default useImagePreload;