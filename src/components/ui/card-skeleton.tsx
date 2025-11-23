import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const CardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      </div>
      <div className="text-xs text-muted-foreground">
        <div className="h-3 w-32 bg-muted animate-pulse rounded mt-1" />
      </div>
    </CardContent>
  </Card>
);

export default CardSkeleton;
