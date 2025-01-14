// src/lib/performance/memoryMonitor.ts

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
  }
  
  export class MemoryMonitor {
    private static instance: MemoryMonitor;
    private memoryStats: MemoryStats[] = [];
    private memoryLeaks: MemoryLeak[] = [];
    private readonly MAX_STATS_LENGTH = 100;
    private subscribers: Set<(stats: MemoryStats) => void> = new Set();
  
    private constructor() {
      this.startMonitoring();
    }
  
    static getInstance(): MemoryMonitor {
      if (!MemoryMonitor.instance) {
        MemoryMonitor.instance = new MemoryMonitor();
      }
      return MemoryMonitor.instance;
    }
  
    private startMonitoring() {
      setInterval(() => {
        this.collectMemoryStats();
      }, 5000); // 5초마다 메모리 상태 체크
    }
  
    private collectMemoryStats() {
      if ('performance' in window && 'memory' in (window as any).performance) {
        const memory = (window as any).performance.memory;
        const stats: MemoryStats = {
          jsHeapSize: memory.jsHeapSizeLimit,
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
          timestamp: Date.now()
        };
  
        this.addStats(stats);
        this.checkMemoryLeak(stats);
        this.notifySubscribers(stats);
      }
    }
  
    private addStats(stats: MemoryStats) {
      this.memoryStats.push(stats);
      if (this.memoryStats.length > this.MAX_STATS_LENGTH) {
        this.memoryStats.shift();
      }
    }
  
    private checkMemoryLeak(stats: MemoryStats) {
      if (this.memoryStats.length < 2) return;
  
      const prevStats = this.memoryStats[this.memoryStats.length - 2];
      const memoryIncrease = stats.usedJSHeapSize - prevStats.usedJSHeapSize;
      const threshold = 1024 * 1024 * 10; // 10MB
  
      if (memoryIncrease > threshold) {
        const leak: MemoryLeak = {
          id: `leak-${Date.now()}`,
          type: 'heap-growth',
          size: memoryIncrease,
          timestamp: Date.now(),
          stackTrace: new Error().stack
        };
        this.memoryLeaks.push(leak);
      }
    }
  
    subscribe(callback: (stats: MemoryStats) => void): () => void {
      this.subscribers.add(callback);
      return () => {
        this.subscribers.delete(callback);
      };
    }
  
    private notifySubscribers(stats: MemoryStats) {
      this.subscribers.forEach(callback => {
        try {
          callback(stats);
        } catch (error) {
          console.error('Error in memory stats subscriber:', error);
        }
      });
    }
  
    getMemoryStats(): MemoryStats[] {
      return [...this.memoryStats];
    }
  
    getMemoryLeaks(): MemoryLeak[] {
      return [...this.memoryLeaks];
    }
  
    clearMemoryLeaks(): void {
      this.memoryLeaks = [];
    }
  }