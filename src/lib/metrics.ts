import { createClient } from './supabase/client';

const supabase = createClient();

/**
 * Fetches the count of job entries for a given timeframe.
 * @param timeframe 'month' | 'week' | 'day'
 * @returns The count of jobs.
 */
export async function getJobCounts(timeframe: 'month' | 'week' | 'day'): Promise<number> {
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); // Start of the current week (Sunday)
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(0); // Epoch for all time
  }

  const { count, error } = await supabase
    .from('job_entries')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error(`Error fetching job count for ${timeframe}:`, error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Fetches the count of unique users who submitted job entries in the current day.
 * @returns The count of daily active users.
 */
export async function getDailyActiveUsers(): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of the current day

  const { data, error } = await supabase
    .from('job_entries')
    .select('user_id')
    .gte('created_at', startOfDay.toISOString());

  if (error) {
    console.error('Error fetching daily active users:', error.message);
    return 0;
  }

  if (!data) {
    return 0;
  }

  const uniqueUserIds = new Set(data.map(entry => entry.user_id));
  return uniqueUserIds.size;
}
