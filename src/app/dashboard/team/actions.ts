'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Delete the user from the authentication system (auth.users)
    // This should cascade to the profiles table if the foreign key is set up with ON DELETE CASCADE.
    // If not, we might need to delete from profiles manually first.
    // To be safe and ensure "all connected data" is gone, we can try deleting from profiles first, 
    // but usually deleting the auth user is the root action.
    
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return { success: false, error: authError.message };
    }

    // Revalidate the team page to reflect changes
    revalidatePath('/dashboard/team');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
