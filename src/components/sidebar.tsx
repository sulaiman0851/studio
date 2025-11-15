'use client';

import React from 'react';
import { Home, BarChart2, Settings, Users, Folder, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Analytics', icon: BarChart2, path: '/dashboard/analytics' },
    { name: 'Projects', icon: Folder, path: '/dashboard/projects' },
    { name: 'Team', icon: Users, path: '/dashboard/team' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(
          'fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden',
          isOpen ? 'block' : 'hidden'
        )}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white h-screen flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 bg-gray-900">
          <h1 className="text-2xl font-bold">FieldOps</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => setIsOpen(false)} // Close sidebar on link click on mobile
              className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">&copy; 2025 FieldOps Inc.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;