// src/lib/performance/analysisSystem.ts

import type { AnalysisResult, AnalysisOptions } from '@/types/performance';

type RecommendationType = 'optimization' | 'warning' | 'critical';
type ImpactLevel = 'high' | 'medium' | 'low';

interface MetricData {
  timestamp: number;
  duration: number;
  name?: string;
  error?: boolean;
  memoryUsage?: number;
}

export class PerformanceAnalyzer {
  private readonly DEFAULT_OPTIONS: Required<AnalysisOptions> = {
    timeWindow: 24 * 60 * 60 * 1000, // 24 hours
    anomalyThreshold: 2,             // 2 standard deviations
    predictionWindow: 6 * 60 * 60 * 1000 // 6 hours
  };

  private options: Required<AnalysisOptions>;

  constructor(options: Partial<AnalysisOptions> = {}) {
    this.options = { ...this.DEFAULT_OPTIONS, ...options };
  }

  analyze(metrics: MetricData[]): AnalysisResult {
    if (!metrics.length) {
      return {
        trend: 'stable',
        anomalies: [],
        predictions: [],
        recommendations: []
      };
    }

    return {
      trend: this.analyzeTrend(metrics),
      anomalies: this.detectAnomalies(metrics),
      predictions: this.predictFuture(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
  }

  private analyzeTrend(metrics: MetricData[]): 'improving' | 'declining' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const recentMetrics = metrics.slice(-10);
    const values = recentMetrics.map(m => m.duration);
    
    // Calculate moving average
    const movingAvg = this.calculateMovingAverage(values, 3);
    if (!movingAvg.length) return 'stable';
    
    const trend = movingAvg[movingAvg.length - 1] - movingAvg[0];
    const threshold = Math.abs(movingAvg[0] * 0.05);
    
    if (Math.abs(trend) < threshold) return 'stable';
    return trend < 0 ? 'improving' : 'declining';
  }

  private detectAnomalies(metrics: MetricData[]) {
    if (metrics.length < 2) return [];

    const values = metrics.map(m => m.duration);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );

    return metrics.reduce<Array<{
      timestamp: number;
      metric: string;
      value: number;
      expectedValue: number;
      deviation: number;
    }>>((anomalies, metric) => {
      const deviation = Math.abs(metric.duration - mean) / stdDev;
      if (deviation > this.options.anomalyThreshold) {
        anomalies.push({
          timestamp: metric.timestamp,
          metric: metric.name || 'performance',
          value: metric.duration,
          expectedValue: mean,
          deviation
        });
      }
      return anomalies;
    }, []);
  }

  private predictFuture(metrics: MetricData[]) {
    if (metrics.length < 2) return [];

    const timestamps = metrics.map(m => m.timestamp);
    const values = metrics.map(m => m.duration);

    const n = values.length;
    const sumX = timestamps.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const lastTimestamp = timestamps[timestamps.length - 1];
    const timeStep = this.options.predictionWindow / 6;
    const predictions = [];

    for (let i = 1; i <= 6; i++) {
      const futureTimestamp = lastTimestamp + i * timeStep;
      const predictedValue = slope * futureTimestamp + intercept;

      predictions.push({
        timestamp: futureTimestamp,
        metric: 'performance',
        predictedValue: Math.max(0, predictedValue),
        confidence: 1 - (i * 0.1)
      });
    }

    return predictions;
  }

  private generateRecommendations(metrics: MetricData[]) {
    const recommendations = [];
    const recentMetrics = metrics.slice(-20);
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;

    if (avgDuration > 1000) {
      recommendations.push(
        this.createRecommendation(
          'critical',
          'High average response time detected',
          'high',
          'Consider implementing caching or optimizing database queries'
        )
      );
    }

    const memoryMetrics = recentMetrics.filter(m => typeof m.memoryUsage === 'number');
    if (memoryMetrics.length >= 2) {
      const memoryTrend = this.analyzeTrend(memoryMetrics);
      if (memoryTrend === 'declining') {
        recommendations.push(
          this.createRecommendation(
            'warning',
            'Memory usage is trending upward',
            'medium',
            'Check for memory leaks and unnecessary object retention'
          )
        );
      }
    }

    const errorRate = recentMetrics.filter(m => m.error).length / recentMetrics.length;
    if (errorRate > 0.05) {
      recommendations.push(
        this.createRecommendation(
          'critical',
          'High error rate detected',
          'high',
          'Investigate error patterns and implement error handling'
        )
      );
    }

    return recommendations;
  }

  private createRecommendation(
    type: RecommendationType,
    message: string,
    impact: ImpactLevel,
    suggestion: string
  ) {
    return { type, message, impact, suggestion };
  }

  private calculateMovingAverage(values: number[], window: number): number[] {
    if (values.length < window) return [];
    const result: number[] = [];
    for (let i = 0; i <= values.length - window; i++) {
      const windowValues = values.slice(i, i + window);
      result.push(windowValues.reduce((a, b) => a + b, 0) / window);
    }
    return result;
  }
}
