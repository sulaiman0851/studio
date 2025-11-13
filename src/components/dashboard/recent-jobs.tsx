
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  // Sort jobs by date descending and take the first 5
  const recentJobs = jobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  if (recentJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">No Jobs Found</h3>
            <p className="text-sm text-muted-foreground">
                You have not created any jobs yet.
            </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {recentJobs.map(job => (
        <div className="flex items-center" key={job.id}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${job.assigned_engineer_name?.replace(/\s/g, '')}`} alt="Avatar" />
              <AvatarFallback>{getInitials(job.assigned_engineer_name || 'N/A')}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{job.customer_name}</p>
                <p className="text-sm text-muted-foreground">{job.assigned_engineer_name}</p>
            </div>
            <div className="ml-auto font-medium">
                <Badge 
                    className={cn(
                        "text-xs",
                        job.status === "Completed" && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-700",
                        job.status === "Pending" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700",
                        job.status === "In Progress" && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-700",
                        job.status === "Cancelled" && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-700"
                    )}
                >
                    {job.status}
                </Badge>
            </div>
        </div>
      ))}
    </div>
  );
}
