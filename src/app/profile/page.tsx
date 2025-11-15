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

  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, fullname, email, avatar_url')
        .eq('id', currentUser.id)
        .single();

      if (error || !data) {
        toast({ title: 'Error', description: 'Could not fetch your profile.', variant: 'destructive' });
        router.push('/dashboard');
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [currentUser, authLoading, router, supabase, toast]);

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

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      toast({ title: 'Upload Error', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    // Get public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!publicUrlData) {
        toast({ title: 'Error', description: 'Could not get public URL for avatar.', variant: 'destructive' });
        setUploading(false);
        return;
    }
    const publicURL = publicUrlData.publicUrl;

    // Update avatar_url in the user's auth metadata
    const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicURL },
    });

    // Update avatar_url in the public profiles table
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicURL })
      .eq('id', currentUser.id);

    if (userUpdateError || profileUpdateError) {
        toast({ title: 'Error', description: 'Failed to update avatar URL.', variant: 'destructive' });
    } else {
        toast({ title: 'Success', description: 'Profile picture updated!' });
        // Refresh profile data
        setProfile(prev => prev ? { ...prev, avatar_url: publicURL } : null);
    }
    
    setUploading(false);
    setAvatarFile(null);
  };

  if (loading || authLoading) {
    return <div>Loading profile...</div>;
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
        {/* Left column for avatar */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <Avatar className="w-32 h-32 mx-auto mb-4">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-4xl">
                {getInitials(profile.fullname) || getInitials(profile.username)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold dark:text-white">{profile.fullname}</h2>
            <p className="text-muted-foreground">@{profile.username}</p>

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

        {/* Right column for details */}
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
