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

  if (loading || (!loading && currentUser)) {
    return <LoadingAnimation />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Platform Kolaborasi Proyek
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Kelola tugas, bagikan file, dan berkomunikasi dengan tim Anda secara efisien.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild>
                  <Link href="/login">
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/register">
                    Register
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center w-full h-24 border-t">
        <p className="text-muted-foreground">Powered by Firebase Studio</p>
      </footer>
    </div>
  );
}
