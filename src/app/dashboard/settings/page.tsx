'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

// Schema for profile update form
const profileFormSchema = z.object({
  fullname: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Schema for password change form
const passwordFormSchema = z
  .object({
    oldPassword: z.string().min(1, { message: 'Old password is required.' }),
    newPassword: z.string().min(8, { message: 'New password must be at least 8 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ['confirmPassword'],
  });
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const SettingsPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  // Form for Profile Update
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfileForm,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  // Form for Password Change
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPasswordForm,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  });

  // Fetch profile data to populate form
  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        const { data, error } = await supabase
          .from('profiles')
          .select('fullname')
          .eq('id', currentUser.id)
          .single();
        if (data) {
          resetProfileForm({ fullname: data.fullname });
        }
      }
    };
    fetchProfile();
  }, [currentUser, supabase, resetProfileForm]);


  const onSubmitProfile = async (data: ProfileFormValues) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({ fullname: data.fullname })
      .eq('id', currentUser.id);

    if (error) {
      toast({ title: 'Error', description: `Failed to update profile: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Your profile has been updated.' });
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    if (!currentUser?.email) {
      toast({ title: 'Error', description: 'Could not find user email.', variant: 'destructive' });
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: data.oldPassword,
    });
    if (signInError) {
      toast({ title: 'Error', description: 'Incorrect old password.', variant: 'destructive' });
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });
    if (updateError) {
      toast({ title: 'Error', description: `Failed to update password: ${updateError.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Your password has been updated successfully.' });
      resetPasswordForm();
    }
  };

  if (authLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Configure your application settings.
        </p>
      </header>
      
      <div className="grid gap-8">
        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Profile</h3>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="fullname">Full Name</Label>
              <Input type="text" id="fullname" {...registerProfile('fullname')} />
              {profileErrors.fullname && <p className="text-sm text-red-500">{profileErrors.fullname.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmittingProfile}>
              {isSubmittingProfile ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Change Password</h3>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="oldPassword">Old Password</Label>
              <Input type="password" id="oldPassword" {...registerPassword('oldPassword')} />
              {passwordErrors.oldPassword && <p className="text-sm text-red-500">{passwordErrors.oldPassword.message}</p>}
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input type="password" id="newPassword" {...registerPassword('newPassword')} />
              {passwordErrors.newPassword && <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>}
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input type="password" id="confirmPassword" {...registerPassword('confirmPassword')} />
              {passwordErrors.confirmPassword && <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </div>

        {/* Notification Settings (Placeholder) */}
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="email-notifications" />
              <Label htmlFor="email-notifications">Receive email notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="sms-notifications" />
              <Label htmlFor="sms-notifications">Receive SMS notifications</Label>
            </div>
            <Button>Save Preferences</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
