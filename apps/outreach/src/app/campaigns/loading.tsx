import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function CampaignsLoading() {
  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <ListSkeleton count={5} />
      </div>
    </div>
  );
}
