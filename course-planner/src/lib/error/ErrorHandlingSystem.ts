// src/lib/error/ErrorHandlingSystem.ts

import type { AppError, ValidationError, ErrorSeverity } from '@/types/error';

interface ErrorHandlerConfig {
  retryAttempts?: number;
  logToServer?: boolean;
  showNotification?: boolean;
}

type ErrorCallback = (error: AppError) => void;

export class ErrorHandlingSystem {
  private static instance: ErrorHandlingSystem;
  private errorCallbacks: Map<string, ErrorCallback>;
  private config: Required<ErrorHandlerConfig>;

  private constructor() {
    this.errorCallbacks = new Map();
    this.config = {
      retryAttempts: 3,
      logToServer: true,
      showNotification: true
    };
  }

  public static getInstance(): ErrorHandlingSystem {
    if (!ErrorHandlingSystem.instance) {
      ErrorHandlingSystem.instance = new ErrorHandlingSystem();
    }
    return ErrorHandlingSystem.instance;
  }

  public handleError(error: Error | AppError, context?: any): void {
    const appError = this.normalizeError(error, context);
    
    // 로깅
    if (this.config.logToServer) {
      this.logError(appError);
    }

    // 알림
    if (this.config.showNotification) {
      this.notifyError(appError);
    }

    // 콜백 실행
    this.errorCallbacks.forEach(callback => {
      try {
        callback(appError);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });

    // 심각한 에러인 경우 전역 에러 핸들러로 전달
    if (appError.severity === 'error') {
      this.handleCriticalError(appError);
    }
  }

  public async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context?: any
  ): Promise<T> {
    let attempts = 0;

    while (attempts < this.config.retryAttempts) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        
        // 마지막 시도였다면 에러 처리
        if (attempts === this.config.retryAttempts) {
          this.handleError(error as Error, context);
          throw error;
        }

        // 재시도 대기
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    throw new Error('Maximum retry attempts exceeded');
  }

  public subscribeToErrors(id: string, callback: ErrorCallback): () => void {
    this.errorCallbacks.set(id, callback);
    return () => {
      this.errorCallbacks.delete(id);
    };
  }

  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  private normalizeError(error: Error | AppError, context?: any): AppError {
    if (this.isAppError(error)) {
      return {
        ...error,
        context: {
          ...error.context,
          ...context
        }
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      severity: 'error' as ErrorSeverity,
      timestamp: Date.now(),
      context: context || {},
      stack: error.stack
    };
  }

  private isAppError(error: any): error is AppError {
    return 'code' in error && 'severity' in error;
  }

  private async logError(error: AppError): Promise<void> {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...error,
          type: 'error',
          timestamp: Date.now()
        })
      });
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }

  private notifyError(error: AppError): void {
    const event = new CustomEvent('app-error', {
      detail: error
    });
    window.dispatchEvent(event);
  }

  private handleCriticalError(error: AppError): void {
    // 심각한 에러 처리 (예: 애플리케이션 상태 복구, 리로드 등)
    console.error('Critical error:', error);
  }

  public getErrorStats(): {
    totalErrors: number;
    criticalErrors: number;
    resolvedErrors: number;
  } {
    // 에러 통계 구현
    return {
      totalErrors: 0,
      criticalErrors: 0,
      resolvedErrors: 0
    };
  }
}