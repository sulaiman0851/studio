
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    if (!newRole) return;
    
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
      <header className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit User Roles</h1>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead className="text-right">Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.username}
                      </TableCell>
                      <TableCell>{profile.role}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          defaultValue={profile.role}
                          onValueChange={(value) => handleSaveRole(profile.id, value)}
                          disabled={profile.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-[180px] float-right">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="engineer">Engineer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
