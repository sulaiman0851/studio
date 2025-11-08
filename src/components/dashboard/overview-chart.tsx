
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Job } from "@/lib/types";

interface OverviewChartProps {
  jobs: Job[];
}

export function OverviewChart({ jobs }: OverviewChartProps) {
  const data = jobs.reduce((acc, job) => {
    const month = new Date(job.date).toLocaleString('default', { month: 'short' });
    const existingMonth = acc.find(item => item.name === month);
    if (existingMonth) {
      existingMonth.total += 1;
    } else {
      acc.push({ name: month, total: 1 });
    }
    return acc;
  }, [] as { name: string; total: number }[]);

  // Simple sort for past 12 months (demo purpose)
  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sortedData = data.sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={sortedData}>
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
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
