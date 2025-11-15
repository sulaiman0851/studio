'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { User, Users, Shield, Edit, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils'; // Using clsx utility for conditional classes

type Profile = {
  id: string;
  username: string;
  role: string;
};

const TeamPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const fetchAllProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('id, username, role');
    if (error) {
      toast({ title: "Error", description: "Could not fetch user list.", variant: "destructive" });
    } else {
      setProfiles(data || []);
    }
  }, [supabase, toast]);

  useEffect(() => {
    const fetchUserRoleAndProfiles = async () => {
      if (authLoading) return;
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profileData) {
        toast({ title: "Error", description: "Could not fetch your user role.", variant: "destructive" });
        router.push('/dashboard');
        return;
      }

      const role = profileData.role;
      setUserRole(role);
      await fetchAllProfiles();
      setLoading(false);
    };

    fetchUserRoleAndProfiles();
  }, [currentUser, authLoading, router, supabase, fetchAllProfiles, toast]);

  const handleRoleChange = async (profileId: string, newRole: string) => {
    if (!newRole) return;

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) {
      toast({ title: "Error", description: `Failed to update role: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Role updated successfully!" });
      await fetchAllProfiles();
    }
    setEditingProfileId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading team members...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Team Management
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            Browse, manage, and assign roles to your team members.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button>
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New User
          </Button>
        )}
      </header>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 p-12 rounded-lg shadow-md">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">No Team Members Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Get started by adding a new user to your team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => {
            const isEditing = editingProfileId === profile.id;
            return (
              <div 
                key={profile.id} 
                className={cn(
                  "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all",
                  isEditing && "ring-2 ring-blue-500"
                )}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full">
                    <User className="text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{profile.username}</h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Shield className="w-4 h-4 mr-1.5" />
                      <span className="font-medium capitalize">{profile.role}</span>
                    </div>
                  </div>
                </div>
                
                {isEditing ? (
                  <div>
                    <Label htmlFor="role-select" className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">Change Role</Label>
                    <Select
                      defaultValue={profile.role}
                      onValueChange={(value) => handleRoleChange(profile.id, value)}
                    >
                      <SelectTrigger id="role-select" className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="engineer">Engineer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  userRole === 'admin' && currentUser?.id !== profile.id && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setEditingProfileId(profile.id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Role
                    </Button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPage;
