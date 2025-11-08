
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAiSuggestion, AiSuggestionInput } from '@/ai/flows/ai-suggestion-helper';
import { z } from 'zod';
import { getJobs as getJobsData, getUsers as getUsersData, saveUsers, saveJobs } from './data';
import type { Job, User, TelegramSettings } from './types';
import { revalidatePath } from 'next/cache';

// --- Telegram Notification Logic ---

const telegramSettingsPath = path.join(process.cwd(), 'src', 'data', 'telegram.json');

async function getTelegramSettings(): Promise<TelegramSettings | null> {
    try {
        if (require('fs').existsSync(telegramSettingsPath)) {
            const data = await fs.readFile(telegramSettingsPath, 'utf-8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Failed to read Telegram settings:', error);
        return null;
    }
}

async function sendTelegramNotification(message: string) {
    const settings = await getTelegramSettings();
    if (!settings || !settings.botToken || !settings.chatId) {
        console.log('Telegram settings are not configured. Skipping notification.');
        return;
    }

    const { botToken, chatId } = settings;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        const result = await response.json();
        if (!result.ok) {
            console.error('Failed to send Telegram notification:', result.description);
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
}

// --- AI Suggestion Action ---

const suggestionSchema = z.object({
  jobType: z.string(),
  customerName: z.string(),
  equipmentType: z.string(),
  serialNumber: z.string(),
  powerRx: z.string(),
  pppoeUsername: z.string().optional(),
  pppoePassword: z.string().optional(),
  ssid: z.string().optional(),
  wlanKey: z.string().optional(),
  reason: z.string().optional(),
});

export async function getAiSuggestionAction(formData: AiSuggestionInput) {
  try {
    const validatedData = suggestionSchema.parse(formData);
    const result = await getAiSuggestion(validatedData);
    return { success: true, suggestions: result.suggestions };
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data." };
    }
    return { success: false, error: "Failed to get AI suggestions." };
  }
}

// --- Data Actions ---

export async function getInitialData() {
  const jobs = await getJobsData();
  const users = await getUsersData();
  return { jobs, users };
}

export async function createJobAction(newJobData: Omit<Job, 'id'>) {
    try {
        const jobs = await getJobsData();
        const newIdNumber = jobs.length > 0 ? Math.max(...jobs.map(j => parseInt(j.id.split('-')[1]))) + 1 : 1;
        const newJob: Job = {
            ...newJobData,
            id: `JOB-${String(newIdNumber).padStart(3, '0')}`,
        };

        const updatedJobs = [...jobs, newJob];
        await saveJobs(updatedJobs);

        // Send notification
        const message = `*New Job Created*\n\n*ID:* ${newJob.id}\n*Customer:* ${newJob.customerName}\n*Type:* ${newJob.jobType}\n*Assigned to:* ${newJob.assignedEngineer || 'Unassigned'}`;
        await sendTelegramNotification(message);

        revalidatePath('/');
        return { success: true, job: newJob };
    } catch (error) {
        console.error('Failed to create job:', error);
        return { success: false, error: 'Failed to create the job.' };
    }
}

export async function updateJobAction(job: Job, userRole: User['role']) {
  try {
    const jobs = await getJobsData();
    let isApprovalRequest = false;

    if (userRole === 'Admin' || userRole === 'Senior') {
      // Admins and Seniors can update directly
      jobs[jobs.findIndex(j => j.id === job.id)] = job;
    } else {
      // Engineers request an update by changing the status
      jobs[jobs.findIndex(j => j.id === job.id)] = { ...job, status: 'Pending Approval' };
      isApprovalRequest = true;
    }

    await saveJobs(jobs);

    if (isApprovalRequest) {
      // Send notification for pending approval
      const message = `*Job Update Requires Approval*\n\n*ID:* ${job.id}\n*Customer:* ${job.customerName}\n*Engineer:* ${job.assignedEngineer}\n\nA job update has been submitted and requires your approval.`;
      await sendTelegramNotification(message);
    }
    
    revalidatePath('/');
    return { success: true, message: `Job ${job.id} action processed successfully.` };
  } catch (error) {
    console.error('Failed to update job:', error);
    return { success: false, error: 'Failed to save the job.' };
  }
}


export async function updateUserRoleAction(userId: string, newRole: User['role']) {
  try {
    const users = await getUsersData();
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    );
    await saveUsers(updatedUsers);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, error: "Failed to update user role." };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const users = await getUsersData();
    const updatedUsers = users.filter(user => user.id !== userId);
    await saveUsers(updatedUsers);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user." };
  }
}

export async function deleteJobAction(jobId: string) {
    try {
      let jobs = await getJobsData();
      jobs = jobs.filter(job => job.id !== jobId);
      await saveJobs(jobs);
      revalidatePath('/');
      return { success: true, message: `Job ${jobId} deleted successfully.` };
    } catch (error) {
      console.error('Failed to delete job:', error);
      return { success: false, error: 'Failed to delete the job.' };
    }
}

export async function registerUserAction(newUser: Omit<User, 'id'>) {
    try {
        const users = await getUsersData();

        if (users.some(u => u.email === newUser.email)) {
            return { success: false, error: 'User with this email already exists.' };
        }

        const newUserWithId: User = {
            ...newUser,
            id: `USR-00${users.length + 1}`,
        };

        const updatedUsers = [...users, newUserWithId];
        await saveUsers(updatedUsers);
        revalidatePath('/');
        
        return { success: true, user: newUserWithId };

    } catch (error) {
        console.error("Failed to register user:", error);
        return { success: false, error: "Failed to register user." };
    }
}

export async function getTelegramSettingsAction() {
    return await getTelegramSettings();
}

export async function saveTelegramSettingsAction(settings: TelegramSettings) {
    try {
        const data = JSON.stringify(settings, null, 2);
        await fs.writeFile(telegramSettingsPath, data, 'utf-8');
        return { success: true, message: 'Telegram settings saved successfully.' };
    } catch (error) {
        console.error('Failed to save Telegram settings:', error);
        return { success: false, error: 'Failed to save settings.' };
    }
}
