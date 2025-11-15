import React from 'react';
import Sidebar from '@/components/sidebar';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-4 right-6 z-10">
          <UserProfileDropdown />
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
