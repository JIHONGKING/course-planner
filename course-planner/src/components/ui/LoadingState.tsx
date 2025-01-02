// src/components/ui/LoadingState.tsx
import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      <p className="text-sm text-gray-500">Loading courses...</p>
    </div>
  );
}