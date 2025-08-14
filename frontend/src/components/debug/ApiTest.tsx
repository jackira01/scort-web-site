'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ApiTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const testApi = async () => {
    setLoading(true);
    
    try {
      const requestBody = {
        fields: ['_id', 'name', 'age', 'location', 'description', 'media', 'verification'],
        limit: 12,
        page: 1,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/filters/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded mb-4">
      <h3 className="font-bold mb-2">API Test:</h3>
      <Button onClick={testApi} disabled={loading}>
        {loading ? 'Testing...' : 'Test API'}
      </Button>
      
      {result && (
        <div className="mt-4">
          <h4 className="font-semibold">Result:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}