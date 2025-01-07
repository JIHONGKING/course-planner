// src/lib/realtime.ts

interface UpdateEvent {
    type: 'course' | 'plan' | 'semester';
    action: 'add' | 'update' | 'delete';
    data: any;
    timestamp: number;
  }
  
  export class RealtimeSync {
    private subscribers: Map<string, Set<(event: UpdateEvent) => void>>;
    private lastUpdate: Map<string, number>;
  
    constructor() {
      this.subscribers = new Map();
      this.lastUpdate = new Map();
    }
  
    subscribe(type: string, callback: (event: UpdateEvent) => void): () => void {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, new Set());
      }
      
      this.subscribers.get(type)?.add(callback);
  
      // Unsubscribe 함수 반환
      return () => {
        this.subscribers.get(type)?.delete(callback);
      };
    }
  
    publish(event: UpdateEvent): void {
      this.lastUpdate.set(`${event.type}:${event.action}`, event.timestamp);
  
      this.subscribers.get(event.type)?.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in realtime subscriber:', error);
        }
      });
    }
  
    getLastUpdate(type: string, action: string): number {
      return this.lastUpdate.get(`${type}:${action}`) || 0;
    }
  
    // 모든 구독 제거
    clearSubscriptions(): void {
      this.subscribers.clear();
    }
  }
  
  export const realtimeSync = new RealtimeSync();