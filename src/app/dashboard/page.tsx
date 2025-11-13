
'use client';

import { HardHat, Users, Activity, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentJobs } from '@/components/dashboard/recent-jobs';
import { useAppContext } from '@/components/app-shell';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { currentUser, jobs, users } = useAppContext();

  useEffect(() => {
    console.log('/dashboard digunakan!');
  }, []);

  if (!currentUser || !jobs || !users) {
    return null; // Data is loading in AppShell
  }

  const stats = {
    jobsCompleted: jobs.filter(j => j.status === 'Completed').length,
    jobsPending: jobs.filter(j => j.status === 'Pending' || j.status === 'In Progress').length,
    activeEngineers: users.filter(u => u.role === 'Engineer').length,
    completionRate: jobs.length > 0 ? Math.round((jobs.filter(j => j.status === 'Completed').length / jobs.length) * 100) : 0,
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {currentUser.name}!</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.jobsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobsPending}</div>
            <p className="text-xs text-muted-foreground">
              Currently active or waiting
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Engineers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEngineers}</div>
            <p className="text-xs text-muted-foreground">
              Currently on the platform
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of all jobs this month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart jobs={jobs} />
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your 5 most recently created jobs.
            </p>
          </CardHeader>
          <CardContent>
            <RecentJobs jobs={jobs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
