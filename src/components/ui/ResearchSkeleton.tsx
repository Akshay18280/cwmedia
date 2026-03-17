import React from 'react';

/* ─── Base Skeleton Primitives ────────────────────────── */

/** Rectangular skeleton block with shimmer animation */
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

/** Single line of skeleton text */
export const SkeletonText: React.FC<{ width?: string; className?: string }> = ({ width = '100%', className = '' }) => (
  <div className={`skeleton h-3 rounded ${className}`} style={{ width }} />
);

/** Skeleton circle (avatar, icon placeholder) */
export const SkeletonCircle: React.FC<{ size?: string; className?: string }> = ({ size = 'w-8 h-8', className = '' }) => (
  <div className={`skeleton rounded-full ${size} ${className}`} />
);

/* ─── Composed Skeletons ─────────────────────────────── */

/** Chat message skeleton — matches MessageBubble layout */
export const SkeletonMessage: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => (
  <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
    <SkeletonCircle />
    <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <SkeletonBlock className="h-16 w-64 rounded-2xl" />
      <SkeletonText width="60px" />
    </div>
  </div>
);

/** Card skeleton — matches report cards and stat cards */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-2xl border border-medium-contrast/30 bg-medium-contrast/10 p-5 space-y-3 ${className}`}>
    <div className="flex items-center gap-2">
      <SkeletonCircle size="w-6 h-6" />
      <SkeletonText width="40%" />
    </div>
    <SkeletonText width="90%" />
    <SkeletonText width="70%" />
    <SkeletonText width="80%" />
  </div>
);

/** Chart skeleton — matches BarChart/PieChart areas */
export const SkeletonChart: React.FC<{ height?: string }> = ({ height = 'h-52' }) => (
  <div className={`rounded-2xl border border-medium-contrast/30 bg-medium-contrast/10 p-5`}>
    <div className="flex items-center gap-2 mb-4">
      <SkeletonCircle size="w-4 h-4" />
      <SkeletonText width="150px" />
    </div>
    <div className={`${height} flex items-end gap-2 px-4`}>
      {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <SkeletonBlock className="rounded-t" style={{ height: `${h}%` } as React.CSSProperties} />
        </div>
      ))}
    </div>
  </div>
);

/** List skeleton — matches research history, source lists */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl border border-medium-contrast/20 bg-medium-contrast/5 p-3">
        <SkeletonCircle size="w-10 h-10" />
        <div className="flex-1 space-y-1.5">
          <SkeletonText width={`${70 + (i * 10) % 30}%`} />
          <SkeletonText width={`${40 + (i * 15) % 30}%`} className="h-2" />
        </div>
      </div>
    ))}
  </div>
);

/** Full report skeleton — matches ReportViewer layout */
export const SkeletonReport: React.FC = () => (
  <div className="space-y-4 animate-count-up">
    {/* Report header */}
    <div className="rounded-2xl border border-medium-contrast/30 bg-medium-contrast/10 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <SkeletonCircle size="w-8 h-8" className="rounded-lg" />
        <SkeletonText width="60%" className="h-5" />
      </div>
      <SkeletonText width="95%" />
      <SkeletonText width="80%" />
      <div className="flex gap-4 pt-3 border-t border-medium-contrast/20">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <SkeletonCircle size="w-3.5 h-3.5" />
            <SkeletonText width="50px" className="h-2" />
          </div>
        ))}
      </div>
    </div>

    {/* Confidence banner */}
    <SkeletonBlock className="h-12 rounded-xl" />

    {/* Key findings */}
    <SkeletonCard />

    {/* Financial charts */}
    <SkeletonChart />

    {/* Report sections */}
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-medium-contrast/20 bg-medium-contrast/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SkeletonCircle size="w-6 h-6" className="rounded-md" />
            <SkeletonText width={`${100 + i * 30}px`} />
          </div>
          <SkeletonCircle size="w-4 h-4" />
        </div>
      ))}
    </div>
  </div>
);

/** Stat card row skeleton — matches Dashboard stats */
export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-medium-contrast/30 bg-medium-contrast/10 p-4 space-y-2">
        <SkeletonText width="60%" className="h-2" />
        <SkeletonText width="40%" className="h-6" />
      </div>
    ))}
  </div>
);

/** Graph placeholder skeleton */
export const SkeletonGraph: React.FC<{ height?: string }> = ({ height = 'h-[400px]' }) => (
  <div className={`w-full ${height} rounded-xl bg-graph-container border border-medium-contrast/30 flex items-center justify-center`}>
    <div className="relative">
      {/* Fake node dots */}
      <div className="w-3 h-3 rounded-full skeleton absolute -top-8 left-1/2 -translate-x-1/2" />
      <div className="w-2 h-2 rounded-full skeleton absolute top-0 -left-10" />
      <div className="w-2 h-2 rounded-full skeleton absolute top-0 left-10" />
      <div className="w-2 h-2 rounded-full skeleton absolute top-8 -left-6" />
      <div className="w-2 h-2 rounded-full skeleton absolute top-8 left-6" />
      <div className="text-medium-contrast text-xs mt-16 text-center">Loading visualization...</div>
    </div>
  </div>
);
