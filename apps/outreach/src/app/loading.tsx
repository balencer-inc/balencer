import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function RootLoading() {
  return (
    <div className="px-10 py-10 max-w-[1280px]">
      <PageHeaderSkeleton />
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListSkeleton count={4} height={130} />
      </div>
    </div>
  );
}
