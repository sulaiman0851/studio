'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { HardHat } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message,
      });
    } else {
      toast({
        title: 'Login Berhasil',
        description: 'Anda akan diarahkan ke dashboard.',
      });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <>
      <Toaster />
      <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Login</h1>
              <p className="text-balance text-muted-foreground">
                Masukkan email Anda untuk login ke akun Anda
              </p>
            </div>
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Lupa password Anda?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Belum punya akun?{' '}
              <Link href="/register" className="underline">
                Daftar
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden bg-muted lg:flex items-center justify-center flex-col text-center p-8 bg-background">
          <HardHat className="h-24 w-24 mb-4 text-primary" />
          <h2 className="text-4xl font-bold mb-2">Platform Kolaborasi Proyek</h2>
          <p className="text-lg text-muted-foreground">
            Kelola tugas, bagikan file, dan berkomunikasi dengan tim Anda secara efisien.
          </p>
        </div>
      </div>
    </>
  );
}
