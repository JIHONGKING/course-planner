// src/components/dev/ApiTester.tsx

import React, { useState } from 'react';  // useState import 추가

export default function ApiTester() {
    const [status, setStatus] = useState<string>('');
    
    const testConnection = async () => {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setStatus(JSON.stringify(data, null, 2));
    };
    
    return (
      <div className="p-4">
        <button onClick={testConnection}>Test API Connection</button>
        <pre className="mt-4">{status}</pre>
      </div>
    );
  }