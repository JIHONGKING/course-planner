// src/lib/performance/AlertSystem.ts

export interface AlertConfig {
  id: string;
  type: 'performance' | 'memory' | 'error';
  threshold: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface Alert {
  id: string;
  timestamp: number;
  type: 'performance' | 'memory' | 'error';
  message: string;
  severity: 'info' | 'warning' | 'error';
  data: any;
}

export class AlertSystem {
  private static instance: AlertSystem;
  private alerts: Alert[] = [];
  private configurations: Map<string, AlertConfig> = new Map();
  private subscribers: Set<(alert: Alert) => void> = new Set();

  private constructor() {}

  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  setConfiguration(config: AlertConfig): void {
    this.configurations.set(config.id, config);
  }

  removeConfiguration(id: string): void {
    this.configurations.delete(id);
  }

  subscribe(callback: (alert: Alert) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  checkThreshold(metricType: string, value: number, metadata?: any): void {
    for (const [_, config] of this.configurations) {
      if (value > config.threshold) {
        const alert: Alert = {
          id: `${metricType}-${Date.now()}`,
          timestamp: Date.now(),
          type: config.type,
          message: config.message,
          severity: config.severity,
          data: { value, threshold: config.threshold, ...metadata }
        };

        this.addAlert(alert);
      }
    }
  }

  private addAlert(alert: Alert): void {
    this.alerts.push(alert);
    this.notifySubscribers(alert);
  }

  private notifySubscribers(alert: Alert): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(alert);
      } catch (error) {
        console.error('Error in alert subscriber:', error);
      }
    });
  }

  getAlerts(options: { type?: string; severity?: string; } = {}): Alert[] {
    return this.alerts.filter(alert => {
      if (options.type && alert.type !== options.type) return false;
      if (options.severity && alert.severity !== options.severity) return false;
      return true;
    });
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}