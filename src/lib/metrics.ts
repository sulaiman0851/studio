import { createClient } from "./supabase/client";

const supabase = createClient();

/**
 * Fetches the count of job entries for a given timeframe.
 * @param timeframe 'month' | 'week' | 'day'
 * @returns The count of jobs.
 */
export async function getJobCounts(
  timeframe: "month" | "week" | "day"
): Promise<number> {
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case "day":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      ); // Start of the current week (Sunday)
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(0); // Epoch for all time
  }

  // Optimized: Use head: true to only get count without fetching data
  const { count, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString());

  if (error) {
    console.error(`Error fetching job count for ${timeframe}:`, error);
    return 0;
  }

  return count || 0;
}

/**
 * Fetches the count of unique users who submitted job entries in the current day.
 * Uses PostgreSQL DISTINCT to count unique users efficiently.
 * @returns The count of daily active users.
 */
export async function getDailyActiveUsers(): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Optimized: Use RPC or count distinct created_by
  // Since Supabase doesn't support COUNT(DISTINCT) directly in select,
  // we'll fetch only created_by and use Set (minimal data transfer)
  const { data, error } = await supabase
    .from("jobs")
    .select("created_by")
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    console.error("Error fetching daily active users:", error);
    return 0;
  }

  if (!data) {
    return 0;
  }

  // Count unique user IDs
  const uniqueUserIds = new Set(data.map((entry) => entry.created_by));
  return uniqueUserIds.size;
}

/**
 * Fetches the count of unique users who submitted job entries in the current week.
 * @returns The count of weekly active users.
 */
export async function getWeeklyActiveUsers(): Promise<number> {
  const now = new Date();
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  ); // Start of the current week (Sunday)

  const { data, error } = await supabase
    .from("jobs")
    .select("created_by")
    .gte("created_at", startOfWeek.toISOString());

  if (error) {
    console.error("Error fetching weekly active users:", error);
    return 0;
  }

  if (!data) {
    return 0;
  }

  const uniqueUserIds = new Set(data.map((entry) => entry.created_by));
  return uniqueUserIds.size;
}

export type DashboardMetrics = {
  monthlyJobs: number;
  weeklyJobs: number;
  dailyJobs: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
};

/**
 * Fetches all dashboard metrics in a single query to optimize performance.
 * Fetches minimal data for all jobs in the current month and calculates counts in memory.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  );
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch all jobs for the current month
  // We only need created_at and created_by to calculate all metrics
  const { data, error } = await supabase
    .from("jobs")
    .select("created_at, created_by")
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    console.error("Error fetching dashboard metrics:", error);
    return {
      monthlyJobs: 0,
      weeklyJobs: 0,
      dailyJobs: 0,
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
    };
  }

  if (!data) {
    return {
      monthlyJobs: 0,
      weeklyJobs: 0,
      dailyJobs: 0,
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
    };
  }

  // Calculate metrics in memory
  const monthlyJobs = data.length;
  
  const weeklyJobsData = data.filter(job => new Date(job.created_at) >= startOfWeek);
  const weeklyJobs = weeklyJobsData.length;
  
  const dailyJobsData = data.filter(job => new Date(job.created_at) >= startOfDay);
  const dailyJobs = dailyJobsData.length;

  const weeklyActiveUsers = new Set(weeklyJobsData.map(job => job.created_by).filter(Boolean)).size;
  const dailyActiveUsers = new Set(dailyJobsData.map(job => job.created_by).filter(Boolean)).size;

  return {
    monthlyJobs,
    weeklyJobs,
    dailyJobs,
    dailyActiveUsers,
    weeklyActiveUsers,
  };
}

