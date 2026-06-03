'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-surface-secondary/80',
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-lg mx-auto pb-2">
      {/* Hero skeleton */}
      <div className="hero-gradient rounded-b-[24px] px-4 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full !bg-white/10" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 !bg-white/10" />
            <Skeleton className="h-4 w-16 !bg-white/10" />
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-3 w-20 !bg-white/10" />
          <Skeleton className="h-8 w-48 !bg-white/10" />
          <Skeleton className="h-3 w-28 !bg-white/10" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-2xl !bg-white/10" />
          <Skeleton className="h-14 rounded-2xl !bg-white/10" />
          <Skeleton className="h-14 rounded-2xl !bg-white/10" />
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="px-4 mt-3 flex gap-2">
        <Skeleton className="flex-1 h-10 rounded-xl" />
        <Skeleton className="flex-1 h-10 rounded-xl" />
        <Skeleton className="flex-1 h-10 rounded-xl" />
      </div>

      {/* Chart skeleton */}
      <div className="px-3 mt-4">
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-[120px] rounded-2xl" />
      </div>

      {/* Cards skeleton */}
      <div className="px-3 mt-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <div className="flex gap-2 overflow-hidden">
          <Skeleton className="shrink-0 w-[100px] h-[80px] rounded-2xl" />
          <Skeleton className="shrink-0 w-[100px] h-[80px] rounded-2xl" />
          <Skeleton className="shrink-0 w-[100px] h-[80px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
