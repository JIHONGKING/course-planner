import React, { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

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
  import('../course-planner/CourseList')
);

export const DynamicPlanGenerator = React.lazy(() => 
  import('../course-planner/PlanGenerator')
);

export const DynamicPrerequisiteGraph = React.lazy(() => 
  import('../course-planner/PrerequisiteGraph')
);

// 래퍼 컴포넌트
interface DynamicComponentProps<T extends React.JSX.IntrinsicAttributes> {
  component: ComponentType<T>;
  props: T;
  loadingMessage?: string;
}

export function DynamicComponent<T extends React.JSX.IntrinsicAttributes>({ 
  component: Component, 
  props, 
  loadingMessage 
}: DynamicComponentProps<T>) {
  return (
    <Suspense fallback={<Loading message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );
}