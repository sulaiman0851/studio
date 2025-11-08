
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { HardHat, Bell } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { getInitialData } from '@/lib/actions';
import type { Job, User } from '@/lib/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingAnimation } from '@/components/loading-animation';

interface AppContextType {
  jobs: Job[];
  users: User[];
  currentUser: User | null;
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setCurrentUser: (user: User | null) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom setCurrentUser to also handle localStorage
  const setCurrentUser = (user: User | null) => {
    _setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { users: fetchedUsers, jobs: fetchedJobs } = await getInitialData();
      setUsers(fetchedUsers);
      setJobs(fetchedJobs);

      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          _setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('currentUser');
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const value = { jobs, users, currentUser, setJobs, setUsers, loading, setCurrentUser };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShellContent>{children}</AppShellContent>
    </AppProvider>
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAppContext();
    const pathname = usePathname();
    const router = useRouter();

    const isAuthPage = pathname === '/login' || pathname === '/register';

    useEffect(() => {
      if (!loading && !currentUser && !isAuthPage) {
        router.push('/login');
      }
      if (!loading && currentUser && isAuthPage) {
        router.push('/dashboard');
      }
    }, [loading, currentUser, isAuthPage, router, pathname]);

    if (loading) {
        return <LoadingAnimation />;
    }

    if (!currentUser && !isAuthPage) {
        return <LoadingAnimation />;
    }
    
    if(isAuthPage && !currentUser) {
        return <>{children}</>;
    }

    if (isAuthPage && currentUser) {
        return <LoadingAnimation />;
    }

    const getPageTitle = () => {
        if (pathname.startsWith('/dashboard')) return 'Dashboard';
        const segment = pathname.split('/').pop();
        if (!segment) return 'Dashboard';
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    return (
        <>
            <Sidebar>
                <SidebarHeader className="p-4">
                <div className="flex items-center gap-2">
                    <HardHat className="h-8 w-8 text-primary" />
                    <span className="font-semibold text-xl">FieldOps</span>
                </div>
                </SidebarHeader>
                <SidebarContent>
                {currentUser && <MainNav role={currentUser.role} />}
                </SidebarContent>
            </Sidebar>

            <SidebarInset>
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SidebarTrigger className="sm:hidden" />
                <div className="flex-1">
                    <h1 className="font-semibold text-lg capitalize">{getPageTitle()}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {currentUser && <UserNav user={currentUser} />}
                </div>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </SidebarInset>
        </>
    )
}
