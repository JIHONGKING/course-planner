// src/components/common/DynamicComponent.tsx
import React, { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// 로딩 컴포넌트 
interface LoadingProps {
  message?: string;
}

function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
}

// 동적으로 로드되는 컴포넌트들
export const DynamicCourseList = React.lazy(() => 
  import('../course-planner/CourseList').then(module => ({ default: module.default }))
);

export const DynamicPlanGenerator = React.lazy(() =>
  import('../course-planner/PlanGeneratorComponent').then(module => ({ 
    default: module.default 
  }))
);

export const DynamicPrerequisiteGraph = React.lazy(() =>
  import('../course-planner/PrerequisiteGraph').then(module => ({ default: module.default }))
);

// 동적 컴포넌트를 위한 래퍼 컴포넌트
interface DynamicComponentProps<T extends React.JSX.IntrinsicAttributes> {
  component: ComponentType<T>;
  props: T;
  loadingMessage?: string;
}

export function DynamicComponent<T extends React.JSX.IntrinsicAttributes>({
  component: Component,
  props,
  loadingMessage = 'Loading...'
}: DynamicComponentProps<T>) {
  return (
    <Suspense fallback={<Loading message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );
}

export default {
  DynamicCourseList,
  DynamicPlanGenerator,
  DynamicPrerequisiteGraph,
  DynamicComponent,
};