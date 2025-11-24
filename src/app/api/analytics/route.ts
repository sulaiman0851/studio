import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  const token = authorization?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    // Get all jobs with user info
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, created_at, created_by, assigned_to, status, job_type, due_date')
      .order('created_at', { ascending: false });

    if (jobsError) throw jobsError;

    // Get all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, fullname, role');

    if (profilesError) throw profilesError;

    // Get geotagged photos count per user
    const { data: geotagPhotos, error: geoError } = await supabase
      .from('geotagged_photos')
      .select('user_id, created_at');

    if (geoError) throw geoError;

    // Process data for analytics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User performance metrics
    const userMetrics = profiles?.map(profile => {
      const userJobs = jobs?.filter(j => j.created_by === profile.id) || [];
      const assignedJobs = jobs?.filter(j => j.assigned_to === profile.id) || [];
      const userPhotos = geotagPhotos?.filter(p => p.user_id === profile.id) || [];
      
      const last30DaysJobs = userJobs.filter(j => new Date(j.created_at) >= last30Days);
      const last7DaysJobs = userJobs.filter(j => new Date(j.created_at) >= last7Days);
      
      return {
        id: profile.id,
        username: profile.username,
        fullname: profile.fullname,
        role: profile.role,
        totalJobsCreated: userJobs.length,
        totalJobsAssigned: assignedJobs.length,
        jobsLast30Days: last30DaysJobs.length,
        jobsLast7Days: last7DaysJobs.length,
        totalPhotos: userPhotos.length,
        completedJobs: assignedJobs.filter(j => j.status === 'completed').length,
        pendingJobs: assignedJobs.filter(j => j.status === 'pending').length,
      };
    }) || [];

    // Jobs by type
    const jobsByType = jobs?.reduce((acc, job) => {
      const type = job.job_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Jobs by status
    const jobsByStatus = jobs?.reduce((acc, job) => {
      const status = job.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Daily jobs trend (last 30 days)
    const dailyJobsTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = jobs?.filter(j => {
        const jobDate = new Date(j.created_at).toISOString().split('T')[0];
        return jobDate === dateStr;
      }).length || 0;
      
      dailyJobsTrend.push({
        date: dateStr,
        count,
        label: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
      });
    }

    // Team productivity (jobs per user per week)
    const weeklyProductivity = profiles?.map(profile => {
      const userJobs = jobs?.filter(j => j.created_by === profile.id) || [];
      const last7DaysJobs = userJobs.filter(j => new Date(j.created_at) >= last7Days);
      
      return {
        username: profile.username || profile.fullname,
        count: last7DaysJobs.length
      };
    }).sort((a, b) => b.count - a.count) || [];

    // Response time analysis (for jobs with due dates)
    const jobsWithDueDate = jobs?.filter(j => j.due_date) || [];
    const overdueJobs = jobsWithDueDate.filter(j => new Date(j.due_date!) < now && j.status !== 'completed');
    
    return NextResponse.json({
      summary: {
        totalJobs: jobs?.length || 0,
        totalUsers: profiles?.length || 0,
        totalPhotos: geotagPhotos?.length || 0,
        jobsLast30Days: jobs?.filter(j => new Date(j.created_at) >= last30Days).length || 0,
        jobsLast7Days: jobs?.filter(j => new Date(j.created_at) >= last7Days).length || 0,
        overdueJobs: overdueJobs.length,
        completionRate: jobsWithDueDate.length > 0 
          ? Math.round((jobsWithDueDate.filter(j => j.status === 'completed').length / jobsWithDueDate.length) * 100)
          : 0
      },
      userMetrics,
      jobsByType,
      jobsByStatus,
      dailyJobsTrend,
      weeklyProductivity: weeklyProductivity.slice(0, 10), // Top 10
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
