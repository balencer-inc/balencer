import { cn } from "@/lib/utils";

/** 汎用スケルトン */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />;
}

/** ページタイトル用スケルトン */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/** カード型リストアイテムのスケルトン */
export function CardSkeleton({ height = 96 }: { height?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4" style={{ minHeight: height }}>
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** 複数カードのリスト */
export function ListSkeleton({ count = 4, height }: { count?: number; height?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} height={height} />
      ))}
    </div>
  );
}
