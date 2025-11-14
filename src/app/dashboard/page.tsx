
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

type Job = {
  created_at: string;
};

type ChartData = {
  name: string;
  total: number;
};

type Timeframe = 'day' | 'month' | 'year';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUser(userData.user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', userData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
          router.push('/login');
        } else if (profileData) {
          setUserProfile(profileData);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    };
    getUserAndProfile();
  }, [router, supabase]);

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('created_at');

    if (error) {
      console.error('Error fetching jobs:', error.message);
    } else {
      setJobs(data as Job[]);
    }
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user, fetchJobs]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const processDataForChart = useCallback((): ChartData[] => {
    const counts: { [key: string]: number } = {};
    
    jobs.forEach(job => {
      const date = parseISO(job.created_at);
      let key: string;

      switch (timeframe) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'year':
          key = format(date, 'yyyy');
          break;
        case 'month':
        default:
          key = format(date, 'MMM'); // 'Jan', 'Feb', etc.
          break;
      }
      
      counts[key] = (counts[key] || 0) + 1;
    });

    if (timeframe === 'month') {
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthOrder.map(month => ({
            name: month,
            total: counts[month] || 0,
        }));
    }

    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => a.name.localeCompare(b.name));
      
  }, [jobs, timeframe]);

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  const chartData = processDataForChart();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold text-gray-800">FieldOps Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 hidden sm:inline">
            Welcome, {userProfile.username} ({userProfile.role})!
          </span>
          {userProfile.role === 'admin' && (
             <Button variant="outline" onClick={() => router.push('/editrole')}>
                Edit Roles
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="destructive"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Job Activity</CardTitle>
            <CardDescription>
              Overview of jobs created over time.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
                <Button variant={timeframe === 'day' ? 'default' : 'outline'} onClick={() => setTimeframe('day')}>Day</Button>
                <Button variant={timeframe === 'month' ? 'default' : 'outline'} onClick={() => setTimeframe('month')}>Month</Button>
                <Button variant={timeframe === 'year' ? 'default' : 'outline'} onClick={() => setTimeframe('year')}>Year</Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

