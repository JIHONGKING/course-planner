// src/app/test/page.tsx
'use client';

import DragTest from '@/components/test/DragTest';

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Drag and Drop Test Page</h1>
      <DragTest />
    </div>
  );
}