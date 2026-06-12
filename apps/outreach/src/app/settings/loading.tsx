import { Skeleton, PageHeaderSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="px-10 py-10 max-w-[1080px]">
      <PageHeaderSkeleton />
      <div className="mt-10 space-y-4">
        <Skeleton className="h-5 w-32" />
        <CardSkeleton height={200} />
        <CardSkeleton height={200} />
      </div>
    </div>
  );
}
