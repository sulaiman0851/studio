import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const SettingsPage = () => {
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
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input type="text" id="name" placeholder="Your Name" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Your Email" />
            </div>
            <Button>Update Profile</Button>
          </div>
        </div>

        {/* Notification Settings */}
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
