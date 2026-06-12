import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function SendsLoading() {
  return (
    <div className="px-10 py-10 max-w-[1280px]">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <ListSkeleton count={6} />
      </div>
    </div>
  );
}
