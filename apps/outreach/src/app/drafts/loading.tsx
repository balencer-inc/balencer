import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function DraftsLoading() {
  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <div className="flex items-center gap-3 px-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} height={80} />
          ))}
        </aside>
        <section className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </section>
      </div>
    </div>
  );
}
