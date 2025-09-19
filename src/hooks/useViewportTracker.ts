import { useEffect, useRef, useCallback } from 'react';

export const useViewportTracker = (
  onEnterViewport: () => void,
  threshold: number = 0.5
) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onEnterViewport();
    }
  }, [onEnterViewport]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: '0px 0px -10% 0px' // Trigger when post is 10% into viewport
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      hasTriggeredRef.current = false;
    };
  }, [handleIntersection, threshold]);

  return elementRef;
};