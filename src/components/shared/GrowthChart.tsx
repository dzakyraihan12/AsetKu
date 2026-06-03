'use client';

import { useMemo } from 'react';
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

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[100px]">
        <p className="text-caption text-muted-foreground/30">Belum ada data</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
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
          formatter={(v: number) => [formatCurrency(v), 'Total']}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid hsl(var(--border) / 0.2)',
            background: 'hsl(var(--surface))',
            fontSize: 11,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: '6px 10px',
          }}
          labelStyle={{ fontSize: 9, color: 'hsl(var(--muted-foreground) / 0.4)' }}
          cursor={{ stroke: 'hsl(var(--primary) / 0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
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
          activeDot={{ r: 3.5, strokeWidth: 2, stroke: 'hsl(var(--surface))', fill: 'hsl(var(--primary))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
