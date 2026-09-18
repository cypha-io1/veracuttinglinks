type ProductGridSkeletonProps = {
  count?: number;
  gridClassName?: string;
  cardClassName?: string;
};

export default function ProductGridSkeleton({
  count = 8,
  gridClassName = 'grid grid-cols-2 md:grid-cols-4 gap-6',
  cardClassName = 'rounded-3xl border border-gray-100 bg-white p-4 shadow-sm',
}: ProductGridSkeletonProps) {
  return (
    <div className={gridClassName} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className={`${cardClassName} animate-pulse`}>
          <div className="mb-4 aspect-square w-full rounded-2xl bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
          <div className="mt-5 h-10 w-full rounded-xl bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
