// src/components/test/DragTest.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';

// 드래그 가능한 아이템 컴포넌트
function DraggableItem({ id, text }: { id: number; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, dragRef] = useDrag({
    type: 'item',
    item: { id },
    collect: (monitor) => {
      const result = {
        isDragging: monitor.isDragging(),
      };
      console.log('Drag status:', result);
      return result;
    },
  });

  // dragRef를 ref에 연결
  useEffect(() => {
    dragRef(ref);
  }, [dragRef]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: '1px solid #ccc',
        padding: '1rem',
        marginBottom: '0.5rem',
        backgroundColor: 'white',
        cursor: 'move',
      }}
    >
      {text}
      {isDragging && <span className="ml-2 text-blue-500">(Dragging...)</span>}
    </div>
  );
}

// 드롭 영역 컴포넌트
function DropZone({ onDrop }: { onDrop: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'item',
    drop: (item: { id: number }) => {
      console.log('Item dropped:', item);
      onDrop(item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // dropRef를 ref에 연결
  useEffect(() => {
    dropRef(ref);
  }, [dropRef]);

  // 드롭 영역의 상태에 따른 스타일 계산
  const getBorderColor = () => {
    if (isOver) {
      return canDrop ? 'border-green-500' : 'border-red-500';
    }
    return 'border-gray-300';
  };

  return (
    <div
      ref={ref}
      className={`
        h-48 border-2 border-dashed rounded-lg p-4 transition-colors
        ${getBorderColor()}
        ${isOver && canDrop ? 'bg-green-50' : ''}
        ${isOver && !canDrop ? 'bg-red-50' : ''}
      `}
    >
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">
          {isOver 
            ? canDrop 
              ? 'Release to drop!' 
              : 'Cannot drop here'
            : 'Drop items here'}
        </p>
      </div>
    </div>
  );
}

// 테스트 컴포넌트
export default function DragTest() {
  console.log('Rendering DragTest component');
  const [items] = React.useState([
    { id: 1, text: 'Drag Me 1' },
    { id: 2, text: 'Drag Me 2' },
  ]);

  const handleDrop = (id: number) => {
    console.log('Item dropped with id:', id);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Drag and Drop Test</h2>
        <div className="flex gap-4">
          <div className="w-1/2">
            <h3 className="mb-2 font-medium">Draggable Items</h3>
            {items.map((item) => (
              <DraggableItem key={item.id} id={item.id} text={item.text} />
            ))}
          </div>
          <div className="w-1/2">
            <h3 className="mb-2 font-medium">Drop Zone</h3>
            <DropZone onDrop={handleDrop} />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}