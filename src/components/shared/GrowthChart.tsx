'use client';

import { useMemo, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { format, subWeeks, subMonths, subYears, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface Props {
  period?: 'week' | 'month' | 'year';
}

export function GrowthChart({ period = 'month' }: Props) {
  const { transactions } = useStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    if (transactions.length === 0) return [];
    const now = new Date();
    let intervals: Date[];

    if (period === 'week') {
      intervals = eachWeekOfInterval({ start: subWeeks(now, 8), end: now });
    } else if (period === 'month') {
      intervals = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    } else {
      intervals = eachMonthOfInterval({ start: subYears(now, 1), end: now });
    }

    return intervals.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const value = transactions
        .filter((t) => t.date <= dateStr)
        .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
      return {
        date: format(date, period === 'year' ? 'MMM yy' : 'MMM', { locale: localeId }),
        value: Math.max(value, 0),
      };
    });
  }, [transactions, period]);

  const handleMouseMove = useCallback((state: { activeTooltipIndex?: number }) => {
    if (state?.activeTooltipIndex !== undefined) {
      setActiveIndex(state.activeTooltipIndex);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[100px]">
        <p className="text-caption text-muted-foreground/30">Belum ada data</p>
      </div>
    );
  }

  const activeData = activeIndex !== null ? data[activeIndex] : data[data.length - 1];

  return (
    <div>
      {/* Persistent data display - tap-friendly */}
      <div className="flex items-baseline justify-between mb-1 px-1">
        <span className="text-[14px] font-bold number-display">{formatCurrency(activeData?.value ?? 0)}</span>
        <span className="text-[9px] text-muted-foreground/40 font-medium">{activeData?.date ?? ''}</span>
      </div>
      <ResponsiveContainer width="100%" height={85}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          onMouseMove={handleMouseMove as any}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground) / 0.35)' }}
            axisLine={false}
            tickLine={false}
            dy={4}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Tooltip
            content={() => null}
            cursor={{ stroke: 'hsl(var(--primary) / 0.3)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#areaGradient)"
            animationDuration={700}
            animationEasing="ease-out"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--surface))', fill: 'hsl(var(--primary))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
