
'use server';

import { getAiSuggestion, AiSuggestionInput } from '@/ai/flows/ai-suggestion-helper';
import { z } from 'zod';
import type { Job, User, TelegramSettings, UserRole } from './types';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase as supabaseAdmin } from './supabase/admin'; // Use admin for server-side mutations

function createSupabaseServerClient() {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
}

// --- Telegram Notification Logic ---

async function getTelegramSettings(): Promise<TelegramSettings | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('settings')
            .select('value')
            .eq('key', 'telegram')
            .single();

        if (error || !data) {
             if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
                console.error('Failed to read Telegram settings:', error.message);
            }
            return null;
        }
        return data.value as TelegramSettings;
    } catch (error) {
        console.error('Error fetching Telegram settings:', error);
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
            headers: { 'Content-Type': 'application/json' },
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
    const supabase = createSupabaseServerClient();
    
    const { data: { user: authUser } } = await supabase.auth.getUser();

    let currentUser: User | null = null;
    if (authUser) {
        const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
        currentUser = userProfile as User | null;
    }

    const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
            *,
            users ( name )
        `);
    
    const jobs = jobsData?.map(j => ({
        ...j,
        id: j.id,
        job_id: j.job_id,
        customer_name: j.customer_name,
        assigned_engineer_name: (j.users as any)?.name || 'Unassigned',
    })) || [];


    const { data: users, error: usersError } = await supabase.from('users').select('*');

    if (jobsError) console.error('Error fetching jobs:', jobsError.message);
    if (usersError) console.error('Error fetching users:', usersError.message);

    return { jobs: jobs as unknown as Job[], users: (users as User[]) || [], currentUser };
}

export async function createJobAction(newJobData: Omit<Job, 'id'|'job_id'>) {
    try {
        const { data: latestJob, error: latestJobError } = await supabaseAdmin
            .from('jobs')
            .select('job_id')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (latestJobError && latestJobError.code !== 'PGRST116') throw latestJobError;

        const newIdNumber = latestJob ? parseInt(latestJob.job_id.split('-')[1]) + 1 : 1;
        const newJobId = `JOB-${String(newIdNumber).padStart(3, '0')}`;
        
        const jobToInsert = {
            ...newJobData,
            job_id: newJobId,
            customer_name: newJobData.customer_name,
            job_type: newJobData.job_type,
            assigned_engineer_id: newJobData.assigned_engineer_id,
        };

        const { data: newJob, error } = await supabaseAdmin
            .from('jobs')
            .insert(jobToInsert)
            .select()
            .single();

        if (error) throw error;
        
        const { data: engineer } = await supabaseAdmin.from('users').select('name').eq('id', newJob.assigned_engineer_id).single();

        const message = `*New Job Created*\n\n*ID:* ${newJob.job_id}\n*Customer:* ${newJob.customer_name}\n*Type:* ${newJob.job_type}\n*Assigned to:* ${engineer?.name || 'Unassigned'}`;
        await sendTelegramNotification(message);

        revalidatePath('/jobs');
        revalidatePath('/dashboard');
        return { success: true, job: newJob };
    } catch (error: any) {
        console.error('Failed to create job:', error.message);
        return { success: false, error: 'Failed to create the job.' };
    }
}

export async function updateJobAction(job: Job, userRole: UserRole) {
  try {
    let isApprovalRequest = false;
    let finalStatus = job.status;

    if (userRole !== 'Admin' && userRole !== 'Senior') {
      finalStatus = 'Pending Approval';
      isApprovalRequest = true;
    }
    
    const { error } = await supabaseAdmin
      .from('jobs')
      .update({
          customer_name: job.customer_name,
          address: job.address,
          job_type: job.job_type,
          status: finalStatus,
          reason: job.reason,
          assigned_engineer_id: job.assigned_engineer_id,
          date: job.date,
          equipment: job.equipment,
          network: job.network,
      })
      .eq('id', job.id);

    if (error) throw error;

    if (isApprovalRequest) {
      const { data: engineer } = await supabaseAdmin.from('users').select('name').eq('id', job.assigned_engineer_id).single();
      const message = `*Job Update Requires Approval*\n\n*ID:* ${job.job_id}\n*Customer:* ${job.customer_name}\n*Engineer:* ${engineer?.name || 'Unknown'}\n\nA job update has been submitted and requires your approval.`;
      await sendTelegramNotification(message);
    }
    
    revalidatePath('/jobs');
    revalidatePath('/notifications');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update job:', error.message);
    return { success: false, error: 'Failed to save the job.' };
  }
}

export async function updateUserRoleAction(userId: string, newRole: UserRole) {
  try {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
    
    if (error) throw error;
    revalidatePath('/engineers');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update user role:", error.message);
    return { success: false, error: "Failed to update user role." };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    // This uses the Supabase Admin client to bypass RLS for user deletion
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    revalidatePath('/engineers');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete user:", error.message);
    return { success: false, error: "Failed to delete user." };
  }
}

export async function deleteJobAction(jobId: number) {
    try {
      const { error } = await supabaseAdmin
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      
      revalidatePath('/jobs');
      revalidatePath('/notifications');
      revalidatePath('/dashboard');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete job:', error.message);
      return { success: false, error: 'Failed to delete the job.' };
    }
}

export async function getTelegramSettingsAction(): Promise<TelegramSettings | null> {
    return await getTelegramSettings();
}

export async function saveTelegramSettingsAction(settings: TelegramSettings) {
    try {
        const { error } = await supabaseAdmin
            .from('settings')
            .upsert({ key: 'telegram', value: settings });

        if (error) throw error;
        
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to save Telegram settings:', error.message);
        return { success: false, error: 'Failed to save settings.' };
    }
}
