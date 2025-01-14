// src/lib/performance/filterSystem.ts

export interface FilterOptions {
    timeRange?: {
      start: number;
      end: number;
    };
    category?: string[];
    threshold?: number;
    severity?: ('info' | 'warning' | 'error')[];
    metricType?: string[];
  }
  
  export class PerformanceFilter {
    static filterMetrics(data: any, options: FilterOptions) {
      let filteredData = {...data};
  
      // 시간 범위 필터링
      if (options.timeRange) {
        filteredData = this.filterByTimeRange(filteredData, options.timeRange);
      }
  
      // 카테고리 필터링
      if (options.category) {
        filteredData = this.filterByCategory(filteredData, options.category);
      }
  
      // 임계값 기반 필터링
      if (options.threshold) {
        filteredData = this.filterByThreshold(filteredData, options.threshold);
      }
  
      return filteredData;
    }
  
    private static filterByTimeRange(data: any, timeRange: { start: number; end: number }) {
      const { operations, slowOperations } = data;
      
      return {
        operations: Object.fromEntries(
          Object.entries(operations).map(([key, value]: [string, any]) => [
            key,
            {
              ...value,
              trend: value.trend.filter((item: any) => 
                item.timestamp >= timeRange.start && item.timestamp <= timeRange.end
              )
            }
          ])
        ),
        slowOperations: slowOperations.filter((op: any) => 
          op.timestamp >= timeRange.start && op.timestamp <= timeRange.end
        )
      };
    }
  
    private static filterByCategory(data: any, categories: string[]) {
      return {
        operations: Object.fromEntries(
          Object.entries(data.operations).filter(([key]) => 
            categories.includes(key)
          )
        ),
        slowOperations: data.slowOperations.filter((op: any) => 
          categories.includes(op.operation)
        )
      };
    }
  
    private static filterByThreshold(data: any, threshold: number) {
      return {
        operations: data.operations,
        slowOperations: data.slowOperations.filter((op: any) => 
          op.duration > threshold
        )
      };
    }
  }