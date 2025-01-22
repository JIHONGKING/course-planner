// src/lib/performance/analysisSystem.ts

import type { AnalysisResult, AnalysisOptions } from '@/types/performance';

export class PerformanceAnalyzer {
  private readonly DEFAULT_OPTIONS = {
    timeWindow: 24 * 60 * 60 * 1000, // 24시간
    anomalyThreshold: 2, // 표준편차의 2배
    predictionWindow: 6 * 60 * 60 * 1000 // 6시간
  };

  private options: Required<AnalysisOptions>;

  constructor(options: Partial<AnalysisOptions> = {}) {
    this.options = { ...this.DEFAULT_OPTIONS, ...options };
  }

  analyze(metrics: { timestamp: number; duration: number; name?: string }[]): AnalysisResult {
    if (!metrics.length) {
      return {
        trend: 'stable',
        anomalies: [],
        predictions: [],
        recommendations: []
      };
    }

    const trend = this.analyzeTrend(metrics);
    const anomalies = this.detectAnomalies(metrics);
    const predictions = this.predictFuture(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      trend,
      anomalies,
      predictions,
      recommendations
    };
  }

  private analyzeTrend(metrics: { duration: number }[]) {
    if (metrics.length < 2) return 'stable';

    const recentMetrics = metrics.slice(-10);
    const values = recentMetrics.map(m => m.duration);
    const trend = this.calculateMovingAverage(values, 3);

    if (trend.length < 2) return 'stable';
    const diff = trend[trend.length - 1] - trend[0];
    const threshold = Math.abs(trend[0] * 0.05);

    if (Math.abs(diff) < threshold) return 'stable';
    return diff < 0 ? 'improving' : 'declining';
  }

  private calculateMovingAverage(values: number[], window: number): number[] {
    if (values.length < window) return [];
    
    const result: number[] = [];
    for (let i = 0; i <= values.length - window; i++) {
      const sum = values.slice(i, i + window).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
    return result;
  }

  private detectAnomalies(metrics: { timestamp: number; duration: number }[]) {
    const values = metrics.map(m => m.duration);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );

    return metrics.reduce<any[]>((anomalies, metric) => {
      const deviation = Math.abs(metric.duration - mean) / stdDev;
      if (deviation > this.options.anomalyThreshold) {
        anomalies.push({
          timestamp: metric.timestamp,
          value: metric.duration,
          expectedValue: mean,
          deviation
        });
      }
      return anomalies;
    }, []);
  }

  private predictFuture(metrics: { timestamp: number; duration: number }[]) {
    // 선형 회귀를 사용한 예측
    const timestamps = metrics.map(m => m.timestamp);
    const values = metrics.map(m => m.duration);
    
    const n = values.length;
    const sumX = timestamps.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 다음 6시간 예측
    const predictions = [];
    const lastTime = timestamps[timestamps.length - 1];
    const step = this.options.predictionWindow / 6;

    for (let i = 1; i <= 6; i++) {
      const futureTime = lastTime + i * step;
      predictions.push({
        timestamp: futureTime,
        metric: 'performance', // metric 필드 추가
        predictedValue: slope * futureTime + intercept,
        confidence: 1 - (i * 0.1)
      });
    }

    return predictions;
  }

  private generateRecommendations(metrics: { duration: number }[]) {
    const recommendations = [] as Array<{
      type: 'optimization' | 'warning' | 'critical';
      message: string;
      impact: 'high' | 'medium' | 'low';
      suggestion: string;
    }>;
    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;

    if (avgDuration > 1000) {
      recommendations.push({
        type: 'optimization' as const,
        message: '평균 응답 시간이 높습니다',
        impact: 'high' as const,
        suggestion: '캐싱 구현 또는 쿼리 최적화를 고려하세요'
      });
    }
    return recommendations;
}
}