'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Upload } from 'lucide-react';

type Profile = {
  username: string;
  fullname: string;
  email: string;
  avatar_url: string;
};

const ProfilePage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // State for preview

  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;
      
      if (!currentUser) {
        // Only redirect if we are sure auth is done and no user is found
        router.push('/login');
        return;
      }

      try {
        console.log('Attempting to fetch profile for ID:', currentUser.id);
        
        // Try fetching all columns to avoid column name mismatches
        // Use maybeSingle() to avoid error if row doesn't exist
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error('Supabase Error:', error);
          toast({ 
            title: 'Error Fetching Profile', 
            description: error.message || 'Unknown error occurred', 
            variant: 'destructive' 
          });
        } else if (!data) {
          console.log('No profile found for user:', currentUser.id);
          // Optional: You could trigger a profile creation here if needed
          toast({
            title: 'Profile Not Found',
            description: 'Please complete your profile details.',
          });
        } else {
          console.log('Profile data fetched:', data);
          setProfile(data);
          
          // Update auth metadata if fullname exists
          if (data.fullname) {
            supabase.auth.updateUser({
              data: { full_name: data.fullname },
            });
          }
        }
      } catch (err) {
        console.error('Unexpected error block:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, authLoading, router, supabase, toast]);

  // Effect to handle preview URL and cleanup
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreviewUrl(objectUrl);

    // Cleanup function to revoke the object URL
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setAvatarFile(event.target.files[0]);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile || !currentUser) return;

    setUploading(true);
    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${currentUser.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      toast({ title: 'Upload Error', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!publicUrlData) {
        toast({ title: 'Error', description: 'Could not get public URL for avatar.', variant: 'destructive' });
        setUploading(false);
        return;
    }
    const publicURL = publicUrlData.publicUrl;

    const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicURL },
    });

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicURL })
      .eq('id', currentUser.id);

    if (userUpdateError || profileUpdateError) {
        toast({ title: 'Error', description: 'Failed to update avatar URL.', variant: 'destructive' });
    } else {
        toast({ title: 'Success', description: 'Profile picture updated!' });
        setProfile(prev => prev ? { ...prev, avatar_url: publicURL } : null);
    }
    
    setUploading(false);
    setAvatarFile(null);
  };

  if (loading || authLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div>Could not load profile.</div>;
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            My Profile
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            View and manage your personal information.
          </p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <Avatar className="w-32 h-32 mx-auto mb-4">
              <AvatarImage src={previewUrl || profile.avatar_url} />
              <AvatarFallback className="text-4xl">
                {getInitials(profile.fullname) || getInitials(profile.username)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold dark:text-white">{profile.fullname}</h2>
            <p className="text-muted-foreground">@{profile.username || profile.email}</p>

            <div className="mt-6 space-y-3">
                <Label htmlFor="avatar-upload" className="cursor-pointer inline-block">
                    <div className="flex items-center justify-center w-full px-4 py-2 border border-dashed rounded-lg hover:bg-accent">
                        <Upload className="w-4 h-4 mr-2" />
                        <span>{avatarFile ? avatarFile.name : 'Choose a file...'}</span>
                    </div>
                    <Input id="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </Label>
                {avatarFile && (
                    <Button onClick={handleUploadAvatar} disabled={uploading} className="w-full">
                        {uploading ? 'Uploading...' : 'Upload New Picture'}
                    </Button>
                )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Personal Information</h3>
            <div className="space-y-4">
                <div>
                    <Label className="text-sm text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-medium dark:text-white">{profile.fullname}</p>
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">Username</Label>
                    <p className="text-lg font-medium dark:text-white">{profile.username}</p>
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="text-lg font-medium dark:text-white">{profile.email}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;