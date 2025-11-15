'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 overflow-y-auto relative dark:text-foreground">
        {/* Header for mobile and user profile */}
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm md:hidden">
            <div className="flex items-center justify-between p-4">
                <button onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                </button>
                <div className="md:hidden">
                    <UserProfileDropdown />
                </div>
            </div>
        </header>

        {/* User profile for desktop */}
        <div className="absolute top-4 right-6 z-10 hidden md:block">
          <UserProfileDropdown />
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
