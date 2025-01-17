// src/lib/api/cachedApi.ts

import { apiCache } from '@/lib/cache/OptimizedCacheManager';  // 경로 수정

interface CachedRequestConfig extends RequestInit {
  ttl?: number;
  skipCache?: boolean;
  cacheKey?: string;
}

export async function cachedFetch<T>(
  url: string,
  config: CachedRequestConfig = {}
): Promise<T> {
  const {
    ttl,
    skipCache = false,
    cacheKey = url,
    ...fetchConfig
  } = config;

  // 캐시 확인 (skipCache가 false일 때)
  if (!skipCache) {
    const cached = apiCache.get(cacheKey); 
    if (cached) {
      return cached; // 불필요한 타입 단언 제거
    }
  }

  // API 호출
  const response = await fetch(url, fetchConfig);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  // 캐시 저장 (skipCache가 false일 때)
  if (!skipCache) {
    await apiCache.set(cacheKey, data, { ttl });
  }

  return data as T;
}

// 과목 API 관련 캐시된 함수들
export const cachedCourseApi = {
  async searchCourses(query: string) {
    const cacheKey = `search:${query}`;
    return cachedFetch(`/api/courses/search?query=${encodeURIComponent(query)}`, {
      cacheKey,
      ttl: 5 * 60 * 1000 // 5 minutes
    });
  },

  async getCourseDetails(courseId: string) {
    const cacheKey = `course:${courseId}`;
    return cachedFetch(`/api/courses/${courseId}`, {
      cacheKey,
      ttl: 30 * 60 * 1000 // 30 minutes
    });
  },

  async getCourseSchedule(courseId: string) {
    const cacheKey = `schedule:${courseId}`;
    return cachedFetch(`/api/courses/${courseId}/schedule`, {
      cacheKey,
      ttl: 15 * 60 * 1000 // 15 minutes
    });
  }
};

// 성능 모니터링 API 관련 캐시된 함수들
export const cachedPerformanceApi = {
  async getMetrics() {
    return cachedFetch('/api/metrics', {
      ttl: 60 * 1000, // 1 minute
      skipCache: false 
    });
  },

  async getSlowOperations() {
    return cachedFetch('/api/metrics/slow-operations', {
      ttl: 30 * 1000, // 30 seconds
      skipCache: false
    });
  }
};