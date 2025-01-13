// src/lib/performance/alertSystem.ts

export interface AlertThreshold {
    operation: string;
    threshold: number;  // milliseconds
    severity: 'warning' | 'error' | 'critical';
  }
  
  export interface PerformanceAlert {
    id: string;
    operation: string;
    duration: number;
    threshold: number;
    severity: 'warning' | 'error' | 'critical';
    timestamp: number;
    metadata?: Record<string, any>;
  }
  
  export class PerformanceAlertSystem {
    private static instance: PerformanceAlertSystem;
    private alerts: PerformanceAlert[] = [];
    private thresholds: AlertThreshold[] = [];
    private subscribers: Set<(alert: PerformanceAlert) => void> = new Set();
    private readonly MAX_ALERTS = 1000;
  
    private constructor() {}
  
    static getInstance(): PerformanceAlertSystem {
      if (!PerformanceAlertSystem.instance) {
        PerformanceAlertSystem.instance = new PerformanceAlertSystem();
      }
      return PerformanceAlertSystem.instance;
    }
  
    setThreshold(threshold: AlertThreshold): void {
      const existingIndex = this.thresholds.findIndex(
        t => t.operation === threshold.operation
      );
      
      if (existingIndex >= 0) {
        this.thresholds[existingIndex] = threshold;
      } else {
        this.thresholds.push(threshold);
      }
    }
  
    removeThreshold(operation: string): void {
      this.thresholds = this.thresholds.filter(t => t.operation !== operation);
    }
  
    subscribe(callback: (alert: PerformanceAlert) => void): () => void {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }
  
    checkPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
      const threshold = this.thresholds.find(t => t.operation === operation);
      if (!threshold || duration <= threshold.threshold) return;
  
      const alert: PerformanceAlert = {
        id: `${operation}-${Date.now()}`,
        operation,
        duration,
        threshold: threshold.threshold,
        severity: threshold.severity,
        timestamp: Date.now(),
        metadata
      };
  
      this.addAlert(alert);
      this.notifySubscribers(alert);
    }
  
    private addAlert(alert: PerformanceAlert): void {
      this.alerts.push(alert);
      if (this.alerts.length > this.MAX_ALERTS) {
        this.alerts.shift();
      }
    }
  
    private notifySubscribers(alert: PerformanceAlert): void {
      this.subscribers.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Error in alert subscriber:', error);
        }
      });
    }
  
    getAlerts(options: {
      operation?: string;
      severity?: 'warning' | 'error' | 'critical';
      startTime?: number;
      endTime?: number;
    } = {}): PerformanceAlert[] {
      return this.alerts.filter(alert => {
        if (options.operation && alert.operation !== options.operation) return false;
        if (options.severity && alert.severity !== options.severity) return false;
        if (options.startTime && alert.timestamp < options.startTime) return false;
        if (options.endTime && alert.timestamp > options.endTime) return false;
        return true;
      });
    }
  
    clearAlerts(): void {
      this.alerts = [];
    }
  
    getAlertStats(): {
      total: number;
      bySeverity: Record<string, number>;
      byOperation: Record<string, number>;
    } {
      return {
        total: this.alerts.length,
        bySeverity: this.alerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byOperation: this.alerts.reduce((acc, alert) => {
          acc[alert.operation] = (acc[alert.operation] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    }
  }
  
  // 사용 예시
  export function initializeAlertSystem(): void {
    const alertSystem = PerformanceAlertSystem.getInstance();
  
    // 기본 임계값 설정
    alertSystem.setThreshold({
      operation: 'validation',
      threshold: 1000,  // 1초
      severity: 'warning'
    });
  
    // 알림 구독
    alertSystem.subscribe((alert) => {
      console.warn('Performance Alert:', {
        operation: alert.operation,
        duration: alert.duration,
        severity: alert.severity
      });
    });
  }