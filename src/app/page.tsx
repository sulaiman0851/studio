'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingAnimation from '@/components/loading-animation';

export default function HomePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  if (loading || currentUser) {
    return <LoadingAnimation />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background text-foreground">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold">
          Welcome to Your App
        </h1>
        <p className="mt-3 text-lg sm:text-2xl text-muted-foreground max-w-2xl">
          The starting point for your next great idea. Built with Next.js and ShadCN UI.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Button asChild size="lg">
            <Link href="/login">
              Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">
              Register
            </Link>
          </Button>
        </div>
      </main>
      <footer className="w-full h-24 flex items-center justify-center border-t">
        <p className="text-muted-foreground">Powered by Firebase Studio</p>
      </footer>
    </div>
  );
}
