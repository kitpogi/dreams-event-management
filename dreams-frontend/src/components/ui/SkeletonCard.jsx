import { Skeleton } from './skeleton';
import { Card } from './Card';

/**
 * SkeletonCard - A skeleton loader for Card components
 */
export const SkeletonCard = ({ className }) => {
  return (
    <Card className={className}>
      <div className="p-6 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </Card>
  );
};

/**
 * SkeletonStatCard - A skeleton loader for dashboard stat cards
 */
export const SkeletonStatCard = () => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </Card>
  );
};

/**
 * SkeletonTableRow - A skeleton loader for table rows
 */
export const SkeletonTableRow = ({ columns = 4 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
};

/**
 * SkeletonList - A skeleton loader for list items
 */
export const SkeletonList = ({ items = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonPackageCard - A skeleton loader for package cards
 */
export const SkeletonPackageCard = () => {
  return (
    <Card>
      <Skeleton className="h-48 w-full rounded-t-lg" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </Card>
  );
};

/**
 * SkeletonPortfolioCard - A skeleton loader for portfolio items
 */
export const SkeletonPortfolioCard = () => {
  return (
    <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
      <Skeleton className="w-full h-full" />
    </div>
  );
};

/**
 * SkeletonTeamCard - A skeleton loader for team members
 */
export const SkeletonTeamCard = () => {
  return (
    <div className="text-center group">
      <Skeleton className="mb-5 aspect-[4/5] rounded-3xl shadow-lg" />
      <div className="flex flex-col items-center space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

export default SkeletonCard;

