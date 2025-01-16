export interface OperationStats {
  count: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
}

export interface Operation {
  stats: OperationStats;
  trend: number[];
}

export interface PerformanceMetrics {
  operations: Record<string, Operation>;
  slowOperations: Array<{
    operation: string;
    duration: number;
    timestamp: number;
  }>;
  totalOperations: number;
  totalDuration: number;
}

export interface AnalysisResult {
  trend: 'improving' | 'declining' | 'stable';
  anomalies: Array<{
    timestamp: number;
    metric: string;
    value: number;
    expectedValue: number;
    deviation: number;
  }>;
  predictions: Array<{
    timestamp: number;
    metric: string;
    predictedValue: number;
    confidence: number;
  }>;
  recommendations: Array<{
    type: 'optimization' | 'warning' | 'critical';
    message: string;
    impact: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
}

export interface AnalysisOptions {
  timeWindow: number;       // Analysis window in milliseconds
  anomalyThreshold: number; // Standard deviations for anomaly detection
  predictionWindow: number; // Future prediction window in milliseconds
}

export interface MemoryStats {
  jsHeapSize: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  timestamp: number;
}

export interface MemoryLeak {
  id: string;
  type: string;
  size: number;
  timestamp: number;
  stackTrace?: string;
  source?: string;
}

interface ExtendedPerformance extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}
