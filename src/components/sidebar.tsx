'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, UserCog, LogOut, HardHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';

type Profile = {
  id: string;
  username: string;
  role: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);


  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, role')
          .eq('id', currentUser.id)
          .single();
        if (data) {
          setUserProfile(data);
        }
        if (error) {
            console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser, supabase]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/jobs', label: 'Daftar Pekerjaan', icon: ListChecks },
    { href: '/editrole', label: 'Edit Peran', icon: UserCog, adminOnly: true },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 shadow-md hidden lg:block">
      <div className="flex h-full flex-col">
        <div className="flex items-center h-16 px-6 border-b dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <HardHat className="h-6 w-6 text-primary" />
            <span className="text-gray-900 dark:text-white">FieldOps</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            if (link.adminOnly && userProfile?.role !== 'admin') {
              return null;
            }
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700',
                  isActive && 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4 border-t dark:border-gray-700">
            {userProfile && (
                <div className="mb-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{userProfile.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile.role}</p>
                </div>
            )}
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
