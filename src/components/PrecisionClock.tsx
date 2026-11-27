import React, { useEffect, useRef } from 'react';

interface PrecisionClockProps {
  showCentiseconds?: boolean;
  className?: string;
}

function formatClock(now: Date, showCentiseconds: boolean): string {
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  if (!showCentiseconds) {
    return `${h}:${m}:${s}`;
  }
  const cs = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
  return `${h}:${m}:${s}.${cs}`;
}

/**
 * Isolated DOM-ref clock readout. Updates textContent directly on interval
 * so centisecond ticks never trigger React tree reconciliation.
 */
export const PrecisionClock: React.FC<PrecisionClockProps> = ({
  showCentiseconds = false,
  className = ''
}) => {
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const update = () => {
      if (spanRef.current) {
        spanRef.current.textContent = formatClock(new Date(), showCentiseconds);
      }
    };
    update();
    const intervalMs = showCentiseconds ? 50 : 500;
    const id = window.setInterval(update, intervalMs);
    return () => window.clearInterval(id);
  }, [showCentiseconds]);

  return (
    <span ref={spanRef} className={`tabular-nums ${className}`}>
      {formatClock(new Date(), showCentiseconds)}
    </span>
  );
};
