import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseIntersectionObserverOptions = {}
) {
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If freezeOnceVisible is true and element is already visible, don't observe
    if (options.freezeOnceVisible && observerRef.current) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        callback(entry);
        
        // If freezeOnceVisible and now visible, disconnect observer
        if (options.freezeOnceVisible && entry.isIntersecting) {
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: options.threshold || 0,
        root: options.root,
        rootMargin: options.rootMargin,
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback, options.threshold, options.root, options.rootMargin, options.freezeOnceVisible]);

  const setElement = (element: Element | null) => {
    elementRef.current = element;
  };

  return { ref: setElement };
}