
'use client';

import { ProfileForm } from '@/components/profile/profile-form';
import { TelegramSettingsForm } from '@/components/profile/telegram-settings-form';
import { useAppContext } from '@/components/app-shell';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return null; // Data is loading in AppShell
  }
  
  return (
    <div className="space-y-6">
      <ProfileForm user={currentUser} />
      {currentUser.role === 'Admin' && (
        <>
          <Separator />
          <TelegramSettingsForm />
        </>
      )}
    </div>
  );
}
