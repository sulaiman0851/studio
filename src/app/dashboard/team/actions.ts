'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch the user's profile to get the name
    const { data: profile } = await supabase
      .from('profiles')
      .select('fullname, username')
      .eq('id', userId)
      .single();

    const nameToPreserve = profile?.fullname || profile?.username || 'Unknown User';

    // 2. Update jobs to store the name
    // We use 'as any' to bypass type checking if the column hasn't been generated in types yet
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ created_by_name: nameToPreserve } as any)
      .eq('created_by', userId);

    if (updateError) {
      console.error('Error updating jobs with creator name:', updateError);
    }

    // 3. Delete the user from the authentication system (auth.users)
    // This should cascade to the profiles table if the foreign key is set up with ON DELETE CASCADE.
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
