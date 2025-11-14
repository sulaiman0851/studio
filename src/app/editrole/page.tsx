'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

// Define the Profile type for better type safety
type Profile = {
  id: string;
  username: string;
  role: string;
};

export default function EditRolePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchAllProfiles = useCallback(async () => {
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, username, role');

    if (allProfilesError) {
      console.error('Error fetching all profiles:', allProfilesError.message);
      alert('Could not fetch user list.');
    } else {
      setProfiles(allProfiles || []);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchUserRoleAndProfiles = async () => {
      setLoading(true);
      if (authLoading) return;
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Fetch the current user's role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching user role:', profileError?.message);
        router.push('/dashboard');
        return;
      }

      const role = profileData.role;
      setUserRole(role);

      if (role !== 'admin') {
        alert('Access Denied: You are not an admin.');
        router.push('/dashboard');
        return;
      }

      await fetchAllProfiles();
      setLoading(false);
    };

    fetchUserRoleAndProfiles();
  }, [currentUser, authLoading, router, supabase, fetchAllProfiles]);

  const handleSaveRole = async (profileId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) {
      console.error('Error updating role:', error.message);
      alert('Failed to update role. See console for details.');
    } else {
      alert('Role updated successfully!');
      // Refetch all profiles to ensure UI is in sync with the database
      await fetchAllProfiles();
    }
  };

  if (authLoading || loading || userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium">Loading or checking permissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Edit User Roles</h1>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
          Back to Dashboard
        </button>
      </header>
      <main className="bg-white p-5 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {profile.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {profile.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      defaultValue={profile.role}
                      onChange={(e) => handleSaveRole(profile.id, e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
                      disabled={profile.id === currentUser?.id} // Disable changing own role
                    >
                      <option value="admin">Admin</option>
                      <option value="senior">Senior</option>
                      <option value="engineer">Engineer</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
