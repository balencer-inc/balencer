import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function ServicesLoading() {
  return (
    <div className="px-10 py-10 max-w-[1080px]">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <ListSkeleton count={4} height={150} />
      </div>
    </div>
  );
}
