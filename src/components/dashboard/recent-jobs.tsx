
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Job } from "@/lib/types";
import { isToday } from 'date-fns';

interface RecentJobsProps {
    jobs: Job[];
}

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
};

export function RecentJobs({ jobs }: RecentJobsProps) {
  const todayJobs = jobs.filter(job => isToday(new Date(job.date)));

  if (todayJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No jobs created today.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {todayJobs.map(job => (
        <div className="flex items-center" key={job.id}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${job.assigned_engineer_name?.replace(/\s/g, '')}`} alt="Avatar" />
              <AvatarFallback>{getInitials(job.assigned_engineer_name || 'N/A')}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{job.assigned_engineer_name}</p>
                <p className="text-sm text-muted-foreground">{job.customer_name}</p>
            </div>
        </div>
      ))}
    </div>
  );
}
