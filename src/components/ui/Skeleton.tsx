import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
    />
  );
}

// Booking card skeleton for the admin calendar
export function BookingCardSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-24 mr-auto" />
        <Skeleton className="h-3 w-40 mr-auto" />
      </div>
    </div>
  );
}

// Time slot skeleton for the calendar grid
export function TimeSlotSkeleton() {
  return (
    <div className="min-h-[60px] p-2 rounded-lg border border-border bg-card">
      <Skeleton className="h-3 w-12 mb-2" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

// Calendar day header skeleton
export function CalendarDaySkeleton() {
  return (
    <div className="text-center p-3 rounded-lg bg-secondary">
      <Skeleton className="h-3 w-12 mx-auto mb-1" />
      <Skeleton className="h-5 w-10 mx-auto" />
    </div>
  );
}

// Full calendar skeleton
export function CalendarSkeleton() {
  return (
    <div className="p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <CalendarDaySkeleton key={i} />
        ))}
      </div>

      {/* Time slots */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, colIdx) => (
              <TimeSlotSkeleton key={colIdx} />
            ))}
          </div>
        ))}
      </div>

      {/* Bookings list skeleton */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Hero section skeleton for the main page
export function HeroSkeleton() {
  return (
    <div className="relative h-screen flex flex-col">
      <Skeleton className="absolute inset-0" />
      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Booking form skeleton
export function BookingFormSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48 mx-auto" />
      
      {/* Days */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-16 flex-shrink-0 rounded-xl" />
        ))}
      </div>

      {/* Time slots */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
