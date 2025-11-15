'use client';

import React, { useState, useEffect } from 'react';
import { getJobCounts, getDailyActiveUsers } from '@/lib/metrics';
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

type JobEntry = {
  id: string;
  created_at: string;
  job_type: string;
  customer_name: string;
  profiles: {
    fullname: string;
  } | null;
};

const DashboardPage = () => {
  const supabase = createClient(); // Initialize Supabase client
  const { currentUser } = useAuth(); // Get currentUser
  const [monthlyJobs, setMonthlyJobs] = useState<number | null>(null);
  const [weeklyJobs, setWeeklyJobs] = useState<number | null>(null);
  const [dailyJobs, setDailyJobs] = useState<number | null>(null);
  const [dailyActiveUsers, setDailyActiveUsers] = useState<number | null>(null); // Changed from weeklyActiveUsers
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [recentActivities, setRecentActivities] = useState<JobEntry[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Helper function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Extract first name
  const getFirstName = (fullName: string | undefined | null) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const userFirstName = getFirstName(currentUser?.user_metadata?.full_name);
  const greeting = getTimeBasedGreeting();

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      const [
        monthlyCount,
        weeklyCount,
        dailyCount,
        activeUsersCount,
      ] = await Promise.all([
        getJobCounts('month'),
        getJobCounts('week'),
        getJobCounts('day'),
        getDailyActiveUsers(), // Changed from getWeeklyActiveUsers
      ]);

      setMonthlyJobs(monthlyCount);
      setWeeklyJobs(weeklyCount);
      setDailyJobs(dailyCount);
      setDailyActiveUsers(activeUsersCount); // Changed from setWeeklyActiveUsers
      setLoadingMetrics(false);
    };

    const fetchRecentActivities = async () => {
      setLoadingActivities(true);
      const { data, error } = await supabase
        .from('job_entries')
        .select('*, profiles(fullname)') // Select job details and join with profiles to get fullname
        .order('created_at', { ascending: false })
        .limit(5); // Fetch last 5 activities

      if (error) {
        console.error('Error fetching recent activities:', error.message);
      } else {
        setRecentActivities(data as JobEntry[]);
      }
      setLoadingActivities(false);
    };

    fetchMetrics();
    fetchRecentActivities();
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard Overview
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          {`Welcome back ${userFirstName || ''}, ${greeting}! Here's a summary of your operations.`}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Jobs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingMetrics ? '...' : monthlyJobs}
            </div>
            <p className="text-xs text-muted-foreground">Total jobs this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Jobs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingMetrics ? '...' : weeklyJobs}
            </div>
            <p className="text-xs text-muted-foreground">Total jobs this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Jobs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingMetrics ? '...' : dailyJobs}
            </div>
            <p className="text-xs text-muted-foreground">Total jobs today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingMetrics ? '...' : dailyActiveUsers}
            </div>
            <p className="text-xs text-muted-foreground">Users submitting jobs today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <UsersChart />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Activity</h3>
        {loadingActivities ? (
          <p className="text-gray-600 dark:text-gray-300 mt-2">Loading activities...</p>
        ) : recentActivities.length > 0 ? (
          <div className="mt-4 space-y-3">
            {recentActivities.map((activity) => (
              <p key={activity.id} className="text-gray-600 dark:text-gray-300">
                - {activity.profiles?.fullname || 'Unknown User'} submitted a '{activity.job_type}' job for '{activity.customer_name}' on {new Date(activity.created_at).toLocaleString()}.
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 mt-2">No recent activities.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;