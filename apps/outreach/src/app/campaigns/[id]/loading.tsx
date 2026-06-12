import { Skeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function CampaignDetailLoading() {
  return (
    <div className="px-10 py-10 max-w-[1200px] space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <ListSkeleton count={4} height={120} />
    </div>
  );
}
