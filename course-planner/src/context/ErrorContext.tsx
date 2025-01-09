// src/context/ErrorContext.tsx

import React, { createContext, useContext, useCallback, useState } from 'react';
import type { AppError } from '@/types/error';

interface ErrorContextType {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (timestamp: number) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: AppError) => {
    const timestamp = Date.now();
    const newError = { ...error, timestamp };

    // 같은 에러 메시지가 있는지 확인
    const hasExistingError = errors.some(
      e => e.message === error.message && e.timestamp && 
      (Date.now() - e.timestamp < 5000)
    );

    // 중복 에러가 아닌 경우에만 추가
    if (!hasExistingError) {
      setErrors(prev => [...prev, newError]);

      // 5초 후 자동으로 에러 제거
      setTimeout(() => {
        removeError(timestamp);
      }, 5000);
    }
  }, [errors]);

  const removeError = useCallback((timestamp: number) => {
    setErrors(prev => prev.filter(error => error.timestamp !== timestamp));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
      {/* Error Display Component */}
      {errors.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {errors.map((error) => (
            <div
              key={error.timestamp || Date.now()}
              className={`p-4 rounded-lg shadow-lg ${
                error.severity === 'error' ? 'bg-red-50 text-red-800' :
                error.severity === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                'bg-blue-50 text-blue-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{error.code}</p>
                  <p className="text-sm">{error.message}</p>
                </div>
                <button
                  onClick={() => error.timestamp && removeError(error.timestamp)}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}