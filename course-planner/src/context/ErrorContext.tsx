// src/context/ErrorContext.tsx
import React, { createContext, useContext, useCallback, useState } from 'react';
import type { AppError, ErrorHandler } from '@/types/error';

interface ErrorContextType {
  errors: AppError[];
  addError: ErrorHandler;
  removeError: (errorId: number) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: AppError) => {
    setErrors(prevErrors => [...prevErrors, { ...error, timestamp: Date.now() }]);
  }, []);

  const removeError = useCallback((timestamp: number) => {
    setErrors(prevErrors => prevErrors.filter(error => error.timestamp !== timestamp));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
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