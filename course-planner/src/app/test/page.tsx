'use client';

import SearchTest from '@/components/test/SearchTest';  // @ 추가

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Course Search Test</h1>
        <SearchTest />
      </div>
    </div>
  );
}