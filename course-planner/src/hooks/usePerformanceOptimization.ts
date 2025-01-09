// src/hooks/usePerformanceOptimization.ts
import { useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';

export function usePerformanceOptimization() {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  // 디바운스된 함수 생성
  const createDebouncedFunction = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    wait: number = 300
  ) => {
    return debounce(fn, wait);
  }, []);

  // 메모이제이션된 값을 생성하는 함수
  const memoizeValue = useCallback(<T>(
    getValue: () => T,
    dependencies: any[]
  ): T => {
    const ref = useRef<{ value: T; deps: any[] }>({ value: getValue(), deps: dependencies });
    
    if (!areEqual(ref.current.deps, dependencies)) {
      ref.current = {
        value: getValue(),
        deps: dependencies
      };
    }
    
    return ref.current.value;
  }, []);

  // 성능 메트릭 수집
  useEffect(() => {
    renderCount.current++;
    const renderTime = Date.now() - startTime.current;

    // 성능 메트릭 로깅
    console.debug('Performance metrics:', {
      renderCount: renderCount.current,
      renderTime,
      timestamp: new Date().toISOString()
    });

    return () => {
      // 클린업 시 최종 메트릭 로깅
      console.debug('Component cleanup:', {
        totalRenders: renderCount.current,
        totalLifetime: Date.now() - startTime.current,
      });
    };
  });

  return {
    renderCount: renderCount.current,
    createDebouncedFunction,
    memoizeValue
  };
}

// 배열 비교 헬퍼 함수
function areEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item, index) => item === arr2[index]);
}