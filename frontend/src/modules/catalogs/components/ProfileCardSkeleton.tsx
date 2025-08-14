import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileCardSkeletonProps {
  viewMode: 'grid' | 'list';
}

export function ProfileCardSkeleton({ viewMode }: ProfileCardSkeletonProps) {
  return (
    <Card className="overflow-hidden bg-card border-border">
      <div className="relative">
        <Skeleton
          className={`w-full ${
            viewMode === 'grid'
              ? 'h-48 sm:h-56 lg:h-64'
              : 'h-40 sm:h-48'
          }`}
        />
        <div className="absolute top-2 lg:top-3 right-2 lg:right-3 flex space-x-1 lg:space-x-2">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>

      <CardContent className="p-4 lg:p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileCardSkeleton;