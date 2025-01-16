// src/lib/alerts.ts

export interface Alert {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    data?: any;
  }
  
  export class AlertSystem {
    private static instance: AlertSystem;
    private subscribers = new Set<(alert: Alert) => void>();
    
    static getInstance(): AlertSystem {
      if (!AlertSystem.instance) {
        AlertSystem.instance = new AlertSystem();
      }
      return AlertSystem.instance;
    }
  
    subscribe(callback: (alert: Alert) => void): () => void {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }
  
    notify(alert: Alert): void {
      this.subscribers.forEach(callback => callback(alert));
    }
  }
  
  export const alertSystem = AlertSystem.getInstance();