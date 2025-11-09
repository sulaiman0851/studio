
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { HardHat, AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
import { getInitialData } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';


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

function EnvVarsWarning() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Card className="max-w-lg border-destructive">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-destructive">Configuration Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-center text-base">
                        Supabase environment variables are missing. The application cannot connect to the database.
                        <br/><br/>
                        Please add <code className="bg-muted px-1 py-0.5 rounded-sm">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-muted px-1 py-0.5 rounded-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your project's environment variables in your hosting provider's dashboard (e.g., Vercel, Netlify).
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    )
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
      return <EnvVarsWarning />;
  }

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { users: fetchedUsers, jobs: fetchedJobs, currentUser: fetchedCurrentUser } = await getInitialData();
        setUsers(fetchedUsers);
        setJobs(fetchedJobs);
        setCurrentUser(fetchedCurrentUser);
      }
      setLoading(false);
    }
    
    loadData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          loadData();
        }
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setJobs([]);
          setUsers([]);
          router.push('/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

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
      // No redirect from auth page if logged in, handled by auth pages themselves
    }, [loading, currentUser, isAuthPage, router]);
    

    if (loading && !isAuthPage) {
        return <LoadingAnimation />;
    }
    
    if (isAuthPage) {
        return <>{children}</>;
    }
    
    if (!currentUser) {
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
