
import fs from 'fs/promises';
import path from 'path';
import type { User, Job } from './types';

// --- IMPORTANT ---
// This application uses local JSON files for data storage, which works for local development.
// However, serverless platforms like Vercel and Netlify have a read-only file system.
// This means any function that tries to WRITE to these files (e.g., saveUsers, saveJobs) will fail in production.
//
// For a production-ready application, you should replace this data layer
// with a persistent database solution like Firebase Firestore, Supabase, or another database service.
//
// The `saveUsers` and `saveJobs` functions below have been modified to prevent write errors on read-only filesystems,
// but they will NOT persist data. Changes will be lost on the next serverless function invocation or page refresh.


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
  // Invalidate cache
  usersCache = users;
  
  // On read-only filesystems (like Vercel/Netlify), writing files will cause an error.
  // We'll skip writing to the file in production environments.
  if (process.env.NODE_ENV === 'development') {
    const filePath = path.join(process.cwd(), 'src', 'data', 'users.json');
    try {
      const data = JSON.stringify(users, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
    } catch (error) {
      console.error('Failed to write to users.json:', error);
      throw error;
    }
  } else {
    console.log('Skipping file write for users.json in production environment.');
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
  // Invalidate cache
  jobsCache = jobs;

  // On read-only filesystems (like Vercel/Netlify), writing files will cause an error.
  // We'll skip writing to the file in production environments.
  if (process.env.NODE_ENV === 'development') {
    const filePath = path.join(process.cwd(), 'src', 'data', 'jobs.json');
    try {
      const data = JSON.stringify(jobs, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
    } catch (error) {
      console.error('Failed to write to jobs.json:', error);
      throw error;
    }
  } else {
      console.log('Skipping file write for jobs.json in production environment.');
  }
}
