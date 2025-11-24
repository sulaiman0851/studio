'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, Camera, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingAnimation from '@/components/loading-animation';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  summary: {
    totalJobs: number;
    totalUsers: number;
    totalPhotos: number;
    jobsLast30Days: number;
    jobsLast7Days: number;
    overdueJobs: number;
    completionRate: number;
  };
  userMetrics: Array<{
    id: string;
    username: string;
    fullname: string;
    role: string;
    totalJobsCreated: number;
    totalJobsAssigned: number;
    jobsLast30Days: number;
    jobsLast7Days: number;
    totalPhotos: number;
    completedJobs: number;
    pendingJobs: number;
  }>;
  jobsByType: Record<string, number>;
  jobsByStatus: Record<string, number>;
  dailyJobsTrend: Array<{ date: string; count: number; label: string }>;
  weeklyProductivity: Array<{ username: string; count: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setError('Unauthorized');
          return;
        }

        const response = await fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div>
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Team Analytics
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            Comprehensive analytics for your team's performance
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingAnimation />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Team Analytics
          </h1>
        </header>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error loading analytics: {error || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const jobsByTypeData = Object.entries(data.jobsByType).map(([name, value]) => ({ name, value }));
  const jobsByStatusData = Object.entries(data.jobsByStatus).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Team Analytics
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Comprehensive analytics for your team's performance and productivity
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.jobsLast7Days} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Jobs completed on time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Jobs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{data.summary.overdueJobs}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Jobs Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs Trend (Last 30 Days)</CardTitle>
            <CardDescription>Daily job creation over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyJobsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Jobs Created" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Productivity */}
        <Card>
          <CardHeader>
            <CardTitle>Team Productivity (This Week)</CardTitle>
            <CardDescription>Jobs created per team member in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="username" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Jobs Created" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Jobs by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Type</CardTitle>
            <CardDescription>Distribution of job types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobsByTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {jobsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Jobs by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobsByStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {jobsByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
          <CardDescription>Detailed performance metrics for each team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-right p-3 font-semibold">Jobs Created</th>
                  <th className="text-right p-3 font-semibold">Jobs Assigned</th>
                  <th className="text-right p-3 font-semibold">Completed</th>
                  <th className="text-right p-3 font-semibold">Pending</th>
                  <th className="text-right p-3 font-semibold">Photos</th>
                  <th className="text-right p-3 font-semibold">Last 7 Days</th>
                </tr>
              </thead>
              <tbody>
                {data.userMetrics
                  .sort((a, b) => b.totalJobsCreated - a.totalJobsCreated)
                  .map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.fullname || user.username}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">{user.totalJobsCreated}</td>
                      <td className="p-3 text-right">{user.totalJobsAssigned}</td>
                      <td className="p-3 text-right text-green-600 dark:text-green-400">{user.completedJobs}</td>
                      <td className="p-3 text-right text-yellow-600 dark:text-yellow-400">{user.pendingJobs}</td>
                      <td className="p-3 text-right">{user.totalPhotos}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.jobsLast7Days > 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {user.jobsLast7Days}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
