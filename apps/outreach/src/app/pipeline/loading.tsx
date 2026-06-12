import { Skeleton, ListSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

export default function PipelineLoading() {
  return (
    <div className="px-10 py-10 max-w-[1280px]">
      <PageHeaderSkeleton />
      <div className="mt-8 bg-card border border-border rounded-xl p-6">
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
      <div className="mt-8">
        <ListSkeleton count={5} height={80} />
      </div>
    </div>
  );
}
