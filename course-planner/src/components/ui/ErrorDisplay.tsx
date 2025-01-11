import React from 'react';
import { AlertCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { AppError } from '@/types/error';
import { useError } from '@/context/ErrorContext';

// 개별 에러 알림
export function ErrorAlert({ error, onClose }: { error: AppError; onClose: () => void }) {
  const iconMap = {
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };

  const bgColorMap = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textColorMap = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  };

  return (
    <div className={`rounded-lg border p-4 ${bgColorMap[error.severity]} relative`}>
      <div className="flex items-start gap-3">
        {iconMap[error.severity]}
        <div className="flex-1">
          <h4 className={`font-medium ${textColorMap[error.severity]}`}>
            {error.code}
          </h4>
          <p className={`mt-1 text-sm ${textColorMap[error.severity]}`}>
            {error.message}
          </p>
          {error.context && (
            <pre className="mt-2 text-xs overflow-x-auto">
              {JSON.stringify(error.context, null, 2)}
            </pre>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// 에러 목록 컨테이너
export default function ErrorDisplay() {
  const { errors, removeError } = useError();

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 space-y-2 z-50">
      {errors.map((error) => {
        if (!error.timestamp) return null;
        return (
          <ErrorAlert
            key={error.timestamp}
            error={error}
            onClose={() => removeError(error.timestamp || Date.now())}
          />
        );
      })}
      </div>
  );
}