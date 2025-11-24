import { Skeleton } from "@/components/ui/skeleton"

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="relative aspect-square rounded-md overflow-hidden">
          <Skeleton className="h-full w-full" />
          <div className="absolute bottom-0 left-0 w-full p-2 space-y-1">
            <Skeleton className="h-3 w-2/3 bg-black/20" />
            <Skeleton className="h-3 w-1/2 bg-black/20" />
          </div>
        </div>
      ))}
    </div>
  )
}
