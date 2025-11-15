import React from 'react';
import { Home, BarChart2, Settings, Users, Folder } from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Analytics', icon: BarChart2, path: '/dashboard/analytics' },
    { name: 'Projects', icon: Folder, path: '/dashboard/projects' },
    { name: 'Team', icon: Users, path: '/dashboard/team' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-white h-screen flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 bg-gray-900">
        <h1 className="text-2xl font-bold">FieldOps</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
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
  );
};

export default Sidebar;
