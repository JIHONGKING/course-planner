// src/context/PerformanceContext.tsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { PerformanceAnalyzer } from '@/lib/performance/analysisSystem';
import type { PerformanceMetrics, AnalysisResult } from '@/types/performance';

interface PerformanceState {
  metrics: PerformanceMetrics | null;
  analysisResult: AnalysisResult | null;
  isMonitoring: boolean;
  error: Error | null;
}

type PerformanceAction =
  | { type: 'UPDATE_METRICS'; payload: PerformanceMetrics }
  | { type: 'UPDATE_ANALYSIS'; payload: AnalysisResult }
  | { type: 'SET_MONITORING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null };

const initialState: PerformanceState = {
  metrics: null,
  analysisResult: null,
  isMonitoring: false,
  error: null
};

const PerformanceContext = createContext<{
  state: PerformanceState;
  updateMetrics: (metrics: PerformanceMetrics) => void;
  updateAnalysis: (analysis: AnalysisResult) => void;
  toggleMonitoring: () => void;
  setError: (error: Error | null) => void;
} | undefined>(undefined);

function performanceReducer(
  state: PerformanceState,
  action: PerformanceAction
): PerformanceState {
  switch (action.type) {
    case 'UPDATE_METRICS':
      return { ...state, metrics: action.payload };
    case 'UPDATE_ANALYSIS':
      return { ...state, analysisResult: action.payload };
    case 'SET_MONITORING':
      return { ...state, isMonitoring: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(performanceReducer, initialState);
  const analyzer = React.useMemo(() => new PerformanceAnalyzer(), []);

  const updateMetrics = useCallback((metrics: PerformanceMetrics) => {
    dispatch({ type: 'UPDATE_METRICS', payload: metrics });
    
    // Transform metrics for analysis
    const analysisData = Object.values(metrics.operations).flatMap(op => 
      op.trend.map((value, index) => ({
        timestamp: Date.now() - (op.trend.length - index) * 60000, // Approximate timestamps
        duration: value,
        name: 'performance'
      }))
    );

    try {
      const analysisResult = analyzer.analyze(analysisData);
      dispatch({ type: 'UPDATE_ANALYSIS', payload: analysisResult });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    }
  }, [analyzer]);

  const updateAnalysis = useCallback((analysis: AnalysisResult) => {
    dispatch({ type: 'UPDATE_ANALYSIS', payload: analysis });
  }, []);

  const toggleMonitoring = useCallback(() => {
    dispatch({ type: 'SET_MONITORING', payload: !state.isMonitoring });
  }, [state.isMonitoring]);

  const setError = useCallback((error: Error | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  return (
    <PerformanceContext.Provider
      value={{
        state,
        updateMetrics,
        updateAnalysis,
        toggleMonitoring,
        setError
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}