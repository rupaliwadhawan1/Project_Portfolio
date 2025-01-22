import { useEffect, useState } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

export function useResizeObserver(ref: React.RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useEffect(() => {
    const observeTarget = ref.current;
    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      });
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, [ref]);

  return dimensions;
}