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

    // 증가율 기반 탐지로 개선
    const growthRates = recentStats.slice(1).map((stat, index) =>
      (stat.usedJSHeapSize - recentStats[index].usedJSHeapSize) / recentStats[index].usedJSHeapSize
    );
    const averageGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const isAbnormalGrowth = averageGrowthRate > 0.1; // 10% 이상 증가율을 비정상으로 간주

    if (isAbnormalGrowth) {
      const leak: MemoryLeak = {
        id: `leak-${Date.now()}`,
        type: 'abnormal-growth-rate',
        size: stats.usedJSHeapSize - recentStats[0].usedJSHeapSize,
        timestamp: Date.now(),
        stackTrace: new Error().stack,
        source: 'growth-rate-detection',
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
      console.error('Critical memory usage detected:', stats);
    } else if (usageRatio >= this.thresholds.warning) {
      console.warn('High memory usage detected:', stats);
    }
  }

  private notifySubscribers(): void {
    const currentData = this.getCurrentData();
    this.subscribers.forEach((callback, id) => {
      try {
        callback(currentData);
      } catch (error) {
        // 콜백 실행 실패 시 구독 제거
        this.subscribers.delete(id);
        console.warn(`Removing inactive subscriber: ${id}`);
      }
    });
  }

  private isMemoryAPIAvailable(): boolean {
    return typeof performance !== 'undefined' && performance.memory !== undefined;
  }

  private cleanup(): void {
    const now = Date.now();
    const OLD_STATS_THRESHOLD = 3600000;

    this.memoryStats = this.memoryStats.filter(
      (stat) => now - stat.timestamp < OLD_STATS_THRESHOLD
    );

    this.memoryLeaks = this.memoryLeaks.filter(
      (leak) => now - leak.timestamp < OLD_STATS_THRESHOLD
    );
  }
}