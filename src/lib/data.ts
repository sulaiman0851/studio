
import fs from 'fs/promises';
import path from 'path';
import type { User, Job } from './types';

// Memoize data to avoid reading files on every request in development
let usersCache: User[] | null = null;
let jobsCache: Job[] | null = null;

export async function getUsers(): Promise<User[]> {
  if (process.env.NODE_ENV === 'development' && usersCache) {
    return usersCache;
  }

  const filePath = path.join(process.cwd(), 'src', 'data', 'users.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const users: User[] = JSON.parse(data);
    usersCache = users;
    return users;
  } catch (error) {
    console.error('Failed to read or parse users.json:', error);
    return [];
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'src', 'data', 'users.json');
  try {
    const data = JSON.stringify(users, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
    // Invalidate cache after writing
    usersCache = null;
  } catch (error) {
    console.error('Failed to write to users.json:', error);
    throw error;
  }
}

export async function getJobs(): Promise<Job[]> {
  if (process.env.NODE_ENV === 'development' && jobsCache) {
    return jobsCache;
  }
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'jobs.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const jobs: Job[] = JSON.parse(data);
    jobsCache = jobs;
    return jobs;
  } catch (error) {
    console.error('Failed to read or parse jobs.json:', error);
    return [];
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'src', 'data', 'jobs.json');
  try {
    const data = JSON.stringify(jobs, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
    // Invalidate cache after writing
    jobsCache = null;
  } catch (error) {
    console.error('Failed to write to jobs.json:', error);
    throw error;
  }
}
