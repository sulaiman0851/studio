
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { HardHat, AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';

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
import { toast } from '@/hooks/use-toast';


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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
      return <EnvVarsWarning />;
  }

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData(session: Session | null) {
        if (session) {
            const { users: fetchedUsers, jobs: fetchedJobs, currentUser: fetchedCurrentUser } = await getInitialData();
            setUsers(fetchedUsers);
            setJobs(fetchedJobs);
            setCurrentUser(fetchedCurrentUser);
        } else {
            setCurrentUser(null);
            setJobs([]);
            setUsers([]);
        }
        setLoading(false);
    }
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setLoading(true);
        loadData(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

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

    const authRoutes = ['/login', '/register', '/buatakun'];
    const isAuthRoute = authRoutes.includes(pathname);
    
    const [welcomeToastShown, setWelcomeToastShown] = useState(false);

    useEffect(() => {
        if (loading) {
            return; // Wait until we know if a user is logged in or not
        }

        // Case 1: User is logged in and tries to access an auth page
        if (currentUser && isAuthRoute) {
            router.push('/dashboard');
            return;
        }

        // Case 2: User is NOT logged in and tries to access a protected page
        if (!currentUser && !isAuthRoute) {
            router.push('/login');
            return;
        }

        // Show welcome toast only once after the initial login completes
        if (currentUser && !welcomeToastShown) {
             toast({
                title: 'Login Successful',
                description: `Welcome back, ${currentUser.name}!`,
            });
            setWelcomeToastShown(true);
        } 
    }, [loading, currentUser, isAuthRoute, router, pathname, welcomeToastShown]);

    // RENDER LOGIC - This is the definitive fix.
    
    // 1. While loading, show a full-screen animation.
    if (loading) {
        return <LoadingAnimation />;
    }
    
    // 2. If logged in, show the full app shell with sidebar.
    // This correctly handles all protected routes and their content.
    if (currentUser) {
        const getPageTitle = () => {
            // Handle special case for root dashboard route
            if (pathname === '/dashboard') return 'Dashboard';
            // Handle other routes by capitalizing the last segment
            const segment = pathname.split('/').pop();
            if (!segment) return 'Dashboard'; // Fallback
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

    // 3. If NOT logged in, only render children if it's an authentication route.
    // This allows login/register/etc. pages to show. For any other route (including 404s),
    // the useEffect above will have already triggered a redirect to /login, so we can safely show
    // a loading screen as a fallback.
    if (!currentUser && isAuthRoute) {
        return <>{children}</>;
    }
    
    // 4. Default case for unauthenticated users on protected routes, showing loading while redirecting.
    // This also implicitly handles rendering the 404 page correctly because `children` will be the NotFound component if Next.js serves it.
    // When not on an auth route, the useEffect handles the redirect logic.
    if (!isAuthRoute) {
        return <>{children}</>;
    }
    
    return <LoadingAnimation />;
}
