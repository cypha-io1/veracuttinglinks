'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';

interface PrepTimerProps {
  orderId: string;
  placedAt: Date;
  status: 'new' | 'preparing' | 'ready';
  showLabel?: boolean;
}

/**
 * SLA Targets (per order type):
 * - Delivery: 30 minutes max
 * - Pickup: 20 minutes max
 * - Dine-in: 25 minutes max
 */

export default function PrepTimer({
  orderId,
  placedAt,
  status,
  showLabel = true,
}: PrepTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - placedAt.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [placedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  // SLA thresholds (in minutes)
  const getSLAStatus = () => {
    if (minutes < 20) return 'success';
    if (minutes < 30) return 'warning';
    return 'critical';
  };

  const getColorClasses = () => {
    const sla = getSLAStatus();
    switch (sla) {
      case 'success':
        return 'text-black bg-white';
      case 'warning':
        return 'text-black bg-white';
      case 'critical':
        return 'text-black bg-white';
      default:
        return 'text-gray-400 bg-gray-700/30';
    }
  };

  const getBorderClasses = () => {
    const sla = getSLAStatus();
    switch (sla) {
      case 'success':
        return 'border-black';
      case 'warning':
        return 'border-black';
      case 'critical':
        return 'border-black';
      default:
        return 'border-gray-600';
    }
  };

  const formatTime = (minutes: number, seconds: number) => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className={`rounded-lg border-2 p-3 ${getColorClasses()} ${getBorderClasses()}`}>
      <div className="flex items-center gap-2 mb-2">
        <FiClock size={16} />
        {showLabel && <span className="text-xs font-bold uppercase">Prep Time</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tabular-nums">
          {formatTime(minutes, seconds)}
        </span>
        <span className="text-xs text-gray-400">min</span>
      </div>

      {/* SLA Indicator */}
      <div className="mt-3 pt-3 border-t border-current/20 text-xs">
        {getSLAStatus() === 'success' && (
          <p className="text-black">✓ On track</p>
        )}
        {getSLAStatus() === 'warning' && (
          <p className="text-black">⚠ Getting close</p>
        )}
        {getSLAStatus() === 'critical' && (
          <div className="flex items-center gap-1">
            <FiAlertTriangle size={12} />
            <p className="text-black font-bold">ORDER LATE!</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            getSLAStatus() === 'success'
              ? 'bg-white'
              : getSLAStatus() === 'warning'
              ? 'bg-white'
              : 'bg-white'
          }`}
          style={{ width: `${Math.min((minutes / 30) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Extended Timer Component for Board Display
 * Shows compact timer suitable for order cards
 */

export function CompactPrepTimer({
  placedAt,
  isCritical,
  className = '',
}: {
  placedAt: Date;
  isCritical?: boolean;
  className?: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - placedAt.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [placedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const formatTime = (minutes: number, seconds: number) => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isLate = minutes > 5;

  return (
    <div
      className={`flex items-center gap-2 font-mono ${
        isLate
          ? 'text-black font-bold animate-pulse'
          : 'text-gray-300'
      } ${className}`}
    >
      <FiClock size={14} />
      <span>{formatTime(minutes, seconds)}</span>
      {isLate && <span className="text-black text-sm">!</span>}
    </div>
  );
}
