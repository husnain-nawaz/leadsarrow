import React, { useState, useEffect, useRef } from 'react';

/**
 * TopLoadingBar - Ultra-responsive, smooth progressive top loader
 * Replaces static/frozen bars with an active, advancing progress runner.
 * 
 * @param {boolean} loading - Whether data is actively loading/fetching
 * @param {number} [progress] - Optional explicit progress percentage (0-100)
 * @param {string} [className] - Additional wrapper styling
 * @param {string} [height] - Height class (default: 'h-1')
 */
export default function TopLoadingBar({
  loading = false,
  progress: explicitProgress = null,
  className = '',
  height = 'h-1'
}) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (loading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setVisible(true);
      setOpacity(1);

      if (typeof explicitProgress === 'number') {
        setInternalProgress(Math.min(100, Math.max(0, explicitProgress)));
        return;
      }

      // Initial responsive jump to acknowledge fetch immediately
      setInternalProgress((prev) => (prev > 0 && prev < 80 ? prev : 18));

      // Progressive crawl so it actively shows movement without freezing
      intervalRef.current = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev < 38) return prev + Math.random() * 9 + 4;
          if (prev < 68) return prev + Math.random() * 6 + 2;
          if (prev < 86) return prev + Math.random() * 2.5 + 1;
          if (prev < 95) return prev + 0.4;
          return prev;
        });
      }, 160);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Snap to 100% completion
      setInternalProgress(100);

      // Smooth fade out after briefly showing 100%
      timeoutRef.current = setTimeout(() => {
        setOpacity(0);
        timeoutRef.current = setTimeout(() => {
          setVisible(false);
          setInternalProgress(0);
        }, 220);
      }, 160);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading, explicitProgress]);

  if (!visible && internalProgress === 0) return null;

  const currentPercent = typeof explicitProgress === 'number' ? explicitProgress : internalProgress;

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-40 overflow-hidden pointer-events-none transition-opacity duration-200 ${height} ${className}`}
      style={{ opacity }}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-orange-500/10 dark:bg-orange-950/40" />

      {/* Advancing progress bar */}
      <div
        className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 relative transition-all duration-200 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, currentPercent))}%`,
          boxShadow: '0 0 12px rgba(249, 115, 22, 0.7), 0 0 4px rgba(251, 191, 36, 0.9)'
        }}
      >
        {/* Glowing runner head */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-white/60 blur-[1px]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_12px_#f97316]" />

        {/* Continuous light sweep across the bar */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.4s_infinite]" />
      </div>
    </div>
  );
}
