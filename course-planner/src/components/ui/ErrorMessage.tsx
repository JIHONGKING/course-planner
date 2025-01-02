// src/components/ui/ErrorMessage.tsx
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  retry?: () => void;
}

export function ErrorMessage({ message = 'Failed to load courses', retry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg bg-red-50 p-4 my-4">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
        <div className="flex-1 text-sm text-red-700">
          {message}
        </div>
        {retry && (
          <button
            onClick={retry}
            className="ml-3 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}