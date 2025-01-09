export const API_ENDPOINTS = {
    COURSES: '/api/courses',
    COURSE_SCHEDULE: (courseId: string) => `/api/courses/${courseId}/schedule`,
    SYNC: '/api/sync'
  } as const;
  
  export const API_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
  } as const;