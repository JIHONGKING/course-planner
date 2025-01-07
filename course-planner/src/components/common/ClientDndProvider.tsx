// src/components/common/ClientDndProvider.tsx
'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useEffect, useState } from 'react';

interface ClientDndProviderProps {
  children: React.ReactNode;
}

export default function ClientDndProvider({ children }: ClientDndProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('DndProvider mounted and HTML5Backend initialized');

    // HTML5 드래그 앤 드롭 지원 확인
    const isHTML5DragDropSupported = 'draggable' in document.createElement('div');
    console.log('HTML5 Drag and Drop supported:', isHTML5DragDropSupported);

    // TouchEvent 지원 확인 (모바일 디바이스용)
    const isTouchSupported = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0;
    console.log('Touch events supported:', isTouchSupported);
  }, []);

  // 클라이언트 사이드에서만 렌더링
  if (!mounted) {
    console.log('Waiting for DndProvider to mount...');
    return <>{children}</>;
  }

  return (
    <DndProvider backend={HTML5Backend} options={{
      enableMouseEvents: true,
      enableKeyboardEvents: true,
      enableTouchEvents: true,
    }}>
      <div className="dnd-enabled">{children}</div>
    </DndProvider>
  );
}