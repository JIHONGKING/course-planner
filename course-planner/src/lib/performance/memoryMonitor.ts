///Users/jihong/Desktop/AutoClassfinder/course-planner/src/lib/performance/memoryMonitor.ts

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

export interface MemoryThresholds {
  warning: number;  // 경고 임계값 (예: 0.7 = 70%)
  critical: number; // 심각 임계값 (예: 0.9 = 90%)
}

interface MemoryTrend {
  growthRate: number;
  isAbnormal: boolean;
  period: number;
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryStats: MemoryStats[] = [];
  private memoryLeaks: MemoryLeak[] = [];
  private readonly MAX_SAMPLES = 100;
  private monitoringInterval: number | null = null;
  private cleanupInterval: number | null = null;
  private subscribers = new Map<string, (data: { stats: MemoryStats; leaks: MemoryLeak[] }) => void>();
  private readonly MONITORING_INTERVAL = 5000; // 5초
  private readonly CLEANUP_INTERVAL = 30000;   // 30초
  private readonly thresholds: MemoryThresholds = {
    warning: 0.7,
    critical: 0.9
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
      this.collectStats();
    }, this.MONITORING_INTERVAL);

    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);

    // 초기 통계 수집
    this.collectStats();
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

  public subscribe(
    id: string,
    callback: (data: { stats: MemoryStats; leaks: MemoryLeak[] }) => void
  ): () => void {
    this.subscribers.set(id, callback);

    // 초기 데이터 전송
    const currentData = this.getCurrentData();
    callback(currentData);

    return () => {
      this.subscribers.delete(id);
    };
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
  
  private collectStats(): void {
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
      timestamp: Date.now()
    };

    this.addStats(stats);
    this.detectMemoryLeak(stats);
    this.notifySubscribers();
  }

  private detectMemoryLeak(stats: MemoryStats): void {
    const recentStats = this.memoryStats.slice(-5);
    if (recentStats.length < 5) return;

    // 메모리 증가율 계산
    const growthRates = recentStats.slice(1).map((stat, index) => 
      (stat.usedJSHeapSize - recentStats[index].usedJSHeapSize) / recentStats[index].usedJSHeapSize
    );

    const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

    // 비정상적인 메모리 증가 감지 (10% 이상 증가)
    if (avgGrowthRate > 0.1) {
      const leak: MemoryLeak = {
        id: `leak-${Date.now()}`,
        type: 'abnormal-growth-rate',
        size: stats.usedJSHeapSize - recentStats[0].usedJSHeapSize,
        timestamp: Date.now(),
        stackTrace: new Error().stack,
        source: 'growth-rate-detection'
      };

      this.memoryLeaks.push(leak);
      this.emitMemoryLeakWarning(leak);
    }
  }

  private addStats(stats: MemoryStats): void {
    this.memoryStats.push(stats);
    if (this.memoryStats.length > this.MAX_SAMPLES) {
      this.memoryStats.shift();
    }

    const usageRatio = stats.usedJSHeapSize / stats.jsHeapSize;
    
    if (usageRatio >= this.thresholds.critical) {
      this.emitMemoryAlert('critical', stats);
    } else if (usageRatio >= this.thresholds.warning) {
      this.emitMemoryAlert('warning', stats);
    }
  }

  private emitMemoryAlert(level: 'warning' | 'critical', stats: MemoryStats): void {
    const event = new CustomEvent('memory-alert', {
      detail: {
        level,
        usageRatio: stats.usedJSHeapSize / stats.jsHeapSize,
        stats
      }
    });
    window.dispatchEvent(event);
  }

  private emitMemoryLeakWarning(leak: MemoryLeak): void {
    const event = new CustomEvent('memory-leak', {
      detail: leak
    });
    window.dispatchEvent(event);
  }

  private cleanup(): void {
    const now = Date.now();
    const OLD_STATS_THRESHOLD = 3600000; // 1시간

    // 오래된 통계 데이터 제거
    this.memoryStats = this.memoryStats.filter(
      stat => now - stat.timestamp < OLD_STATS_THRESHOLD
    );

    // 오래된 메모리 누수 기록 제거
    this.memoryLeaks = this.memoryLeaks.filter(
      leak => now - leak.timestamp < OLD_STATS_THRESHOLD
    );
  }

  public getCurrentData(): { stats: MemoryStats; leaks: MemoryLeak[] } {
    return {
      stats: this.memoryStats[this.memoryStats.length - 1],
      leaks: [...this.memoryLeaks]
    };
  }

  public getMemoryStats(): MemoryStats[] {
    return [...this.memoryStats];
  }

  public getMemoryLeaks(): MemoryLeak[] {
    return [...this.memoryLeaks];
  }

  private isMemoryAPIAvailable(): boolean {
    return typeof performance !== 'undefined' && performance.memory !== undefined;
  }
}