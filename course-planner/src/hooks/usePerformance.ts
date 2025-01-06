// src/hooks/usePerformance.ts
import { 
    useCallback, 
    useRef, 
    useMemo, 
    useState, 
    useEffect,
    RefObject
  } from 'react';
  import { useDebounce } from './useDebounce';
  
  export function useVirtualization<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
  ) {
    const [scrollTop, setScrollTop] = useState(0);
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    
    const visibleItems = useMemo(() => 
      items.slice(startIndex, endIndex).map((item, index) => ({
        ...item,
        style: {
          position: 'absolute',
          top: (startIndex + index) * itemHeight,
          height: itemHeight,
        } as const
      })),
      [items, startIndex, endIndex, itemHeight]
    );
  
    const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    }, []);
  
    return {
      visibleItems,
      totalHeight: items.length * itemHeight,
      onScroll
    };
  }
  
  // 메모이제이션된 데이터 처리를 위한 훅
  export function useDataProcessing<T, R>(
    data: T[],
    processor: (items: T[]) => R,
    deps: any[] = []
  ) {
    return useMemo(() => processor(data), [data, processor, ...deps]);
  }
  
  // 디바운스된 API 호출을 위한 훅
  export function useDebounceApi<T>(
    apiCall: () => Promise<T>,
    delay: number = 300
  ) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const debouncedApiCall = useDebounce(async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('API call failed'));
      } finally {
        setLoading(false);
      }
    }, delay);
  
    return { data, loading, error, call: debouncedApiCall };
  }
  
  // 캐시 처리를 위한 훅
  export function useCache<T>(key: string, initialData?: T) {
    const cache = useRef(new Map<string, T>());
  
    const getData = useCallback((key: string): T | undefined => {
      return cache.current.get(key);
    }, []);
  
    const setData = useCallback((key: string, data: T) => {
      cache.current.set(key, data);
    }, []);
  
    const clearCache = useCallback(() => {
      cache.current.clear();
    }, []);
  
    useEffect(() => {
      if (initialData !== undefined) {
        setData(key, initialData);
      }
    }, [key, initialData, setData]);
  
    return { getData, setData, clearCache };
  }
  
  // 지연 로딩을 위한 훅
  export function useLazyLoad(
    elementRef: RefObject<HTMLElement>,
    callback: () => void,
    options = {}
  ) {
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            callback();
          }
        },
        options
      );
  
      const element = elementRef.current;
      if (element) {
        observer.observe(element);
      }
  
      return () => {
        if (element) {
          observer.unobserve(element);
        }
      };
    }, [elementRef, callback, options]);
  }