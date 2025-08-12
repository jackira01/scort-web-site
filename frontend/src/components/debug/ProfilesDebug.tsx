'use client';

import { useFilteredProfiles } from '@/hooks/use-filtered-profiles';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchFilters } from '@/hooks/use-search-filters';

export default function ProfilesDebug() {
  const queryClient = useQueryClient();
  const { toFilterQuery } = useSearchFilters();
  
  const filters = toFilterQuery();
  
  const { data, isLoading, error, refetch, isError, status } = useFilteredProfiles(filters);
  
  const handleClearCacheAndRefetch = async () => {
    console.log('Clearing cache and refetching...');
    await queryClient.invalidateQueries({ queryKey: ['filtered-profiles'] });
    await refetch();
  };
  
  const handleForceRefetch = async () => {
    console.log('Force refetching...');
    await refetch();
  };
  
  console.log('Debug - Data:', data);
  console.log('Debug - Loading:', isLoading);
  console.log('Debug - Error:', error);
  console.log('Debug - Status:', status);
  console.log('Debug - IsError:', isError);
  
  return (
    <div className="p-4 border rounded mb-4">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <p>Status: {status}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <p>Error: {error ? error.message : 'None'}</p>
      <p>Is Error: {isError ? 'Yes' : 'No'}</p>
      <p>Profiles count: {data?.profiles?.length || 0}</p>
      <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
      <div className="flex gap-2 mt-2">
        <Button onClick={handleForceRefetch}>
          Force Refetch
        </Button>
        <Button onClick={handleClearCacheAndRefetch} variant="outline">
          Clear Cache & Refetch
        </Button>
      </div>
      {data && (
        <div className="mt-2">
          <h4 className="font-semibold">Raw Data:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}