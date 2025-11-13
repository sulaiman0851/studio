
"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Job } from "@/lib/types";
import { format, parse, startOfMonth } from 'date-fns';

interface OverviewChartProps {
  jobs: Job[];
}

export function OverviewChart({ jobs }: OverviewChartProps) {
  const monthlyData = jobs.reduce((acc, job) => {
    const monthKey = format(startOfMonth(new Date(job.date)), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = { name: format(new Date(job.date), 'MMM'), total: 0 };
    }
    acc[monthKey].total += 1;
    return acc;
  }, {} as Record<string, { name: string; total: number }>);

  const sortedData = Object.keys(monthlyData)
    .sort()
    .map(key => monthlyData[key]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={sortedData}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          allowDecimals={false}
        />
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <Tooltip 
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
            }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          fillOpacity={1} 
          fill="url(#colorTotal)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
