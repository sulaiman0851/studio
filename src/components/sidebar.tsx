'use client';

import { Home, BarChart2, Settings, Users, Folder, X, FileText, Camera } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { currentUser, loading, role } = useAuth(); // Import role

  const getTwoWordsFullName = (fullName: string | undefined | null) => {
    if (!fullName) return 'User';
    const words = fullName.split(' ').filter(Boolean); // Filter(Boolean) removes empty strings
    if (words.length >= 2) {
      return `${words[0]} ${words[1]}`;
    }
    return words[0] || 'User';
  };

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Analytics', icon: BarChart2, path: '/dashboard/analytics' },
    { name: 'Projects', icon: Folder, path: '/dashboard/projects' },
    { name: 'Team', icon: Users, path: '/dashboard/team' },
    { name: 'Job Input', icon: FileText, path: '/dashboard/job-input' },
    { name: 'Job List', icon: FileText, path: '/dashboard/jobs' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
    { name: 'Geotag Photo', icon: Camera, path: '/dashboard/geotag' },
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

        {/* Profile Preview Section */}
        <div className="p-4 border-b border-gray-700">
          {loading ? (
            <div className="flex items-center space-x-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-700"></div>
              <div className="h-4 w-24 bg-gray-700 rounded"></div>
            </div>
          ) : currentUser ? (
            <Link
              href="/dashboard/profile"
              className="flex items-center space-x-3 hover:bg-gray-700 p-2 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.user_metadata?.avatar_url || ''} alt={currentUser.email || 'User'} />
                <AvatarFallback>{currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">
                  {getTwoWordsFullName(currentUser.user_metadata?.full_name)}
                </p>
                <p className="text-xs text-gray-400">View Profile</p>
              </div>
            </Link>
          ) : (
            <div className="text-sm text-gray-400">Not logged in</div>
          )}
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

          {/* Admin Section */}
          {role === 'admin' && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </div>
              <Link
                href="/dashboard/admin/telegram-config"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5 mr-3" /> {/* Reusing Settings icon for now */}
                Telegram Config
              </Link>
              <Link
                href="/dashboard/admin/whatsapp-bot"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5 mr-3" /> {/* Reusing Settings icon for now */}
                WhatsApp Bot
              </Link>
            </>
          )}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">&copy; 2025 FieldOps Inc.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;