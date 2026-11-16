export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-surface overflow-hidden">
          <div className="aspect-[4/3] w-full animate-pulse bg-[#EFECE6]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-[#EFECE6]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#EFECE6]" />
            <div className="h-4 w-16 animate-pulse rounded bg-[#EFECE6]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card-surface divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 p-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#EFECE6]" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-[#EFECE6]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[#EFECE6]" />
        </div>
      ))}
    </div>
  );
}