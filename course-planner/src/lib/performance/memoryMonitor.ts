// src/lib/performance/memoryMonitor.ts

// 타입 선언
declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
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

interface MemoryThresholds {
  warning: number;
  critical: number;
}

interface MemoryUsageData {
  stats: MemoryStats[];
  leaks: MemoryLeak[];
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryStats: MemoryStats[] = [];
  private memoryLeaks: MemoryLeak[] = [];
  private readonly MAX_STATS_LENGTH = 100;
  private subscribers = new Map<string, (data: MemoryUsageData) => void>();
  private monitoringInterval: number | null = null;
  private cleanupInterval: number | null = null;
  private readonly MONITORING_INTERVAL = 5000;
  private readonly CLEANUP_INTERVAL = 30000;
  private readonly thresholds: MemoryThresholds = {
    warning: 0.7,
    critical: 0.9,
  };

  private constructor() {}

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  public startMonitoring(): void {
    if (this.monitoringInterval !== null) return;

    this.monitoringInterval = window.setInterval(() => {
      this.collectMemoryStats();
    }, this.MONITORING_INTERVAL);

    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);

    this.collectMemoryStats();
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval !== null) {
      window.clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.cleanupInterval !== null) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  public subscribe(id: string, callback: (data: MemoryUsageData) => void): () => void {
    this.subscribers.set(id, callback);
    const currentData = this.getCurrentData();
    callback(currentData);
    return () => {
      this.subscribers.delete(id);
    };
  }

  public getCurrentData(): MemoryUsageData {
    return {
      stats: this.getMemoryStats(),
      leaks: this.getMemoryLeaks(),
    };
  }

  public getMemoryStats(): MemoryStats[] {
    return [...this.memoryStats];
  }

  public getMemoryLeaks(): MemoryLeak[] {
    return [...this.memoryLeaks];
  }

  public static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  private collectMemoryStats(): void {
    if (!this.isMemoryAPIAvailable()) {
      console.warn('Memory API is not available in this environment');
      return;
    }

    const memory = performance.memory;
    if (!memory) return;

    const stats: MemoryStats = {
      jsHeapSize: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      timestamp: Date.now(),
    };

    this.addStats(stats);
    this.detectMemoryLeak(stats);
    this.notifySubscribers();
  }

  private detectMemoryLeak(stats: MemoryStats): void {
    const recentStats = this.memoryStats.slice(-5);
    if (recentStats.length < 5) return;

    const usageGrowth = recentStats.every(
      (stat, index) =>
        index === 0 || stat.usedJSHeapSize > recentStats[index - 1].usedJSHeapSize
    );

    if (usageGrowth) {
      const leak: MemoryLeak = {
        id: `leak-${Date.now()}`,
        type: 'continuous-growth',
        size: stats.usedJSHeapSize - recentStats[0].usedJSHeapSize,
        timestamp: Date.now(),
        stackTrace: new Error().stack,
        source: 'memory-growth-detection',
      };
      this.memoryLeaks.push(leak);
    }
  }

  private addStats(stats: MemoryStats): void {
    this.memoryStats.push(stats);
    if (this.memoryStats.length > this.MAX_STATS_LENGTH) {
      this.memoryStats.shift();
    }

    const usageRatio = stats.usedJSHeapSize / stats.jsHeapSize;
    if (usageRatio >= this.thresholds.critical) {
      this.handleCriticalMemoryUsage(stats);
    } else if (usageRatio >= this.thresholds.warning) {
      this.handleWarningMemoryUsage(stats);
    }
  }

  private handleCriticalMemoryUsage(stats: MemoryStats): void {
    console.error('Critical memory usage detected:', {
      used: MemoryMonitor.formatBytes(stats.usedJSHeapSize),
      total: MemoryMonitor.formatBytes(stats.jsHeapSize),
    });
  }

  private handleWarningMemoryUsage(stats: MemoryStats): void {
    console.warn('High memory usage detected:', {
      used: MemoryMonitor.formatBytes(stats.usedJSHeapSize),
      total: MemoryMonitor.formatBytes(stats.jsHeapSize),
    });
  }

  private notifySubscribers(): void {
    const currentData = this.getCurrentData();
    this.subscribers.forEach((callback) => {
      try {
        callback(currentData);
      } catch (error) {
        console.error('Error in memory stats subscriber:', error);
      }
    });
  }

  private isMemoryAPIAvailable(): boolean {
    return typeof performance !== 'undefined' && 'memory' in performance;
  }

  private cleanup(): void {
    const now = Date.now();
    const OLD_STATS_THRESHOLD = 3600000; // 1 hour

    this.memoryStats = this.memoryStats.filter(
      (stat) => now - stat.timestamp < OLD_STATS_THRESHOLD
    );

    this.memoryLeaks = this.memoryLeaks.filter(
      (leak) => now - leak.timestamp < OLD_STATS_THRESHOLD
    );
  }
}
